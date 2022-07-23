const storage = window.localStorage;

const timeframesRoster = ['dailies', 'weeklies', 'monthlies', 'dailydrops', 'immortaldailies'];

var currentProfile = 'default';
var currentLayout = 'default';
var dragRow; //global for currently dragged row

/**
 * Populate the HTML with data for a timeFrame and attach listeners
 * @param {String} timeFrame
 * @returns
 */
const populateTable = function (timeFrame, char) {
    profilePrefix = char;
    let data = window[timeFrame];
    let table;
    let hideTable;
    let customOrder;
    let compactLayout = document.body.classList.contains('compact');
		
    const sampleRow = document.querySelector('#sample_row');
    if (profilePrefix != null) {
        table = document.getElementById(profilePrefix + '_' + timeFrame + '_table');
    } else {
        table = document.getElementById(timeFrame + '_table');

    }
    const tbody = table.querySelector('tbody');

    //Hidden table
    hideTable = storage.getItem(timeFrame + '-hide') ?? 'false';
    if (hideTable == 'hide') {
        document.querySelector('div.' + timeFrame + '_table').dataset.hide = 'hide';
    }

    //User defined sorting
    if (profilePrefix != null) {
        customOrder = storage.getItem(profilePrefix + '-' + timeFrame + '-order') ?? 'false';
    } else {
        customOrder = storage.getItem(timeFrame + '-order') ?? 'false';
    }
    if (customOrder !== 'false' && !['asc', 'desc', 'alpha', 'default'].includes(customOrder)) {
        let sortArray = customOrder.split(',');

        data = Object.keys(data).sort(function (a, b) {
            return sortArray.indexOf(a) - sortArray.indexOf(b);
        }).reduce(
            (obj, key) => {
                obj[key] = data[key];
                return obj;
            }, {}
        );
    }

    for (let taskSlug in data) {
        let rowClone = sampleRow.content.cloneNode(true);
        let newRow = rowClone.querySelector('tr');
        let newRowAnchor = rowClone.querySelector('td.activity_name a');
        let newRowColor = rowClone.querySelector('td.activity_color .activity_desc');
        let newRowActColor = rowClone.querySelector('td.activity_color');
        
        newRow.dataset.task = taskSlug;

        if (!!data[taskSlug].url) {
            if (data[taskSlug].url !== "#") {
                newRowAnchor.href = data[taskSlug].url;
            }
        }

        if (!!data[taskSlug].img) {
            newRowAnchor.innerHTML = "<img class='icon' src='../includes/img/activities/" + data[taskSlug].img + ".webp' alt=" + data[taskSlug].img + "/>" + data[taskSlug].task;
        } else {
            newRowAnchor.innerHTML = data[taskSlug].task
        }

        if (!!data[taskSlug].time) {
            newRowAnchor.innerHTML += "<br><br><p class='opencountdown' data-day='"+ data[taskSlug].day + "' data-duration='"+ data[taskSlug].duration + "' data-time='" + data[taskSlug].time + "'></p>"
        }

        if (!!data[taskSlug].desc) {
			let dust = data[taskSlug].desc.replace("{dust}", "<img class='icon' src='../includes/img/activities/dust.webp' alt=Dust/><b style="+"color:#ff0;"+">Enchanted Dust</b>");
            let gems = dust.replace("{gems}", "<img class='icon' src='../includes/img/activities/gem.webp' alt=Gems/><b style="+"color:#2bd999;"+">Normal Gems</b>");
            let ember = gems.replace("{ember}", "<img class='icon' src='../includes/img/activities/ember.webp' alt=Ember/><b style="+"color:#5aabef;"+">Fading Ember</b>");
			let crest1 = ember.replace("{rare_crest}", "<img class='icon' src='../includes/img/activities/rare_crest.webp' alt=RareCrest/><b style="+"color:#ff0;"+">Rare Crest</b>");
			let crest2 = crest1.replace("{leg_crest}", "<img class='icon' src='../includes/img/activities/leg_crest.webp' alt=LegendaryCrest/><b style="+"color:#bf642f;"+">Legendary Crest</b>");
			let dominance = crest2.replace("{dominance}", "<img class='icon' src='../includes/img/activities/dominance.webp' alt=SigilOfDominance/><b style="+"color:#5aabef;"+">Sigil of Dominance</b>");

			newRowColor.innerHTML = dominance;
        }
        
        let checkState = true;
        if (!!data[taskSlug].boxcount) {
            if (!compactLayout) {
                newRowActColor.innerHTML += "<br>";
            }
            for (let i = 0; i < data[taskSlug].boxcount; i++) {

                if (compactLayout) {
                    if (i == 0) {
                        newRowActColor.innerHTML += "<input class=\"form-check-input\" type=\"checkbox\" value=\"\" name=\"" + i + "\" id=\"checkbox_" + data[taskSlug].task.replaceAll(" ", "") + "\">"
                    }

                    if (storage.getItem("checkbox_"+data[taskSlug].task.replaceAll(" ", "")+i)===null) {
                        storage.setItem("checkbox_"+data[taskSlug].task.replaceAll(" ", "")+i, false);
                    }

                    checkState = false;
                }
                else {
                    newRowActColor.innerHTML += "<input class=\"form-check-input\" type=\"checkbox\" value=\"\" name=\"" + i + "\" id=\"checkbox_" + data[taskSlug].task.replaceAll(" ", "") + "\">"
                   
                    if (storage.getItem("checkbox_"+data[taskSlug].task.replaceAll(" ", "")+i)===null) {
                        storage.setItem("checkbox_"+data[taskSlug].task.replaceAll(" ", "")+i, false);
                    }

                    if(storage.getItem("checkbox_"+data[taskSlug].task.replaceAll(" ", "")+i) === 'false'){
                        checkState = false;
                    }
                }
            }
        }
        let hidden = storage.getItem(taskSlug);
        if (hidden === 'hide'){
            checkState = hidden;
        }
        
        tbody.appendChild(newRow);        
        newRow.dataset.completed = checkState;
    }

    //restore checkstates
    let checkBoxes = document.querySelectorAll('input.form-check-input');
    for (let box of checkBoxes) {
        box.checked = (storage.getItem(box.id + box.name) === 'true') ? true : false;
    }
    
    if (['asc', 'desc', 'alpha'].includes(customOrder)) {
        table.dataset.sort = customOrder;
        let tableRows = Array.from(tbody.querySelectorAll('tr'));
        tableRows.sort((a, b) => {
            if (customOrder == 'alpha') {
                return a.dataset.task.localeCompare(b.dataset.task)
            } else if (customOrder == 'asc') {
                return a.dataset.profit - b.dataset.profit;
            } else if (customOrder == 'desc') {
                return b.dataset.profit - a.dataset.profit;
            }
        });

        for (let sortedrow of tableRows) {
            tbody.appendChild(sortedrow);
        }
    }
	
	let tableRowsFront = document.querySelectorAll('#' + timeFrame + '_table tbody tr');
	for (let rowTarget of tableRowsFront) {
		let checked = true;
		let checkboxes = rowTarget.querySelectorAll('input.form-check-input')
				
		if(compactLayout){
			checked = checkboxes[0].checked;
		} else {
			checked = rowTarget.dataset.completed =='true';
		}

		if(checked) {
			let rowArray = Array.from(document.querySelectorAll('#' + timeFrame + '_table tbody tr'));
			rowArray[rowArray.length-1].after(rowTarget);
		}
    }

    let tableRows = Array.from(tbody.querySelectorAll('tr'));
    for (let row of tableRows) {
        if (row.dataset.completed == 'hide') {
            tbody.appendChild(row);
        }
    }
};

/**
 * Attach event listeners to table cells
 */
const tableEventListeners = function () {
    let rowsColor = document.querySelectorAll('td.activity_color');
    let rowsHide = document.querySelectorAll('td.activity_name button.hide-button');
    let checkBoxes = document.querySelectorAll('input.form-check-input');
    let compactLayout = document.body.classList.contains('compact');
    
    for (let box of checkBoxes) {
        box.addEventListener('click', function () {
            let thisTimeframe = this.closest('table').dataset.timeframe;
            let thisCharacter = this.closest('table').dataset.character;
            
            //check if entire group is checked
            let checkBoxGroup = document.querySelectorAll("[id^=" + box.id + "]");
            
            let checked = true;
            for (let group of checkBoxGroup) {
                if (!group.checked){
                    checked = false;
                }
            }
            
            //check task
            let thisRow = this.closest('tr');
            if (!compactLayout) {
                thisRow.dataset.completed = checked;
            }
			
			//move row to bottom
			if(checked) {
				let rowArray = Array.from(document.querySelectorAll('#' + thisTimeframe + '_table tbody tr'));
				rowArray[rowArray.length-1].after(thisRow);
			}
            
            //save state
            storage.setItem(box.id + box.name, box.checked);
            storage.setItem(thisTimeframe + '-updated', new Date().getTime());
        });
    }
    
    for (let colorCell of rowsColor) {
        let descriptionAnchors = colorCell.querySelectorAll('a');
        for (let anchor of descriptionAnchors) {
            anchor.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }
    }

    for (let rowHide of rowsHide) {
        rowHide.addEventListener('click', function () {
            let thisTbody = this.closest('tbody');
            let thisRow = this.closest('tr');
            let taskSlug = thisRow.dataset.task;
            let thisCharacter = this.closest('table').dataset.character;
            thisRow.dataset.completed = 'hide';
            eventTracking("hide", "slugs", taskSlug);
            if (thisCharacter != null) {
                storage.setItem(thisCharacter + '-' + taskSlug, 'hide');
            } else {
                storage.setItem(taskSlug, 'hide');
            }
            thisTbody.appendChild(thisRow);
        });
    }
};

/**
 * Attach drag and drop functionality after elements added to DOM
 * @param {String} timeFrame
 */
const draggableTable = function (timeFrame, char) {
    profilePrefix = char;
    let targetRows;
    if (profilePrefix != null) {
        targetRows = document.querySelectorAll('#' + profilePrefix + '_' + timeFrame + '_table tbody tr');
    } else {
        targetRows = document.querySelectorAll('#' + timeFrame + '_table tbody tr');
    }

    for (let row of targetRows) {
        row.addEventListener('dragstart', function (e) {
            eventTracking("drag start", "layout", "table layout");
            dragRow = e.target;
        });

        row.addEventListener('dragenter', function (e) {
            this.classList.add('dragover');
        });

        row.addEventListener('dragover', function (e) {
            e.preventDefault();
            let rowArray
            let thisCharacter = this.closest('table').dataset.character;
            //requery this in case rows reordered since load
            if (thisCharacter != null) {
                rowArray = Array.from(document.querySelectorAll('#' + thisCharacter + '_' + timeFrame + '_table tbody tr'));
            } else {
                rowArray = Array.from(document.querySelectorAll('#' + timeFrame + '_table tbody tr'));
            }
            
            let dragOverRow = e.target.closest('tr');

            if (rowArray.indexOf(dragRow) < rowArray.indexOf(dragOverRow)) {
                dragOverRow.after(dragRow);
            } else {
                dragOverRow.before(dragRow);
            }
        });

        row.addEventListener('dragleave', function (e) {
            this.classList.remove('dragover');
        });

        row.addEventListener('dragend', function (e) {
            this.classList.remove('dragover');
            let clearRows;
            let thisCharacter = this.closest('table').dataset.character;
            if (thisCharacter != null) {
                clearRows = document.querySelectorAll('#' + thisCharacter + '_' + timeFrame + '_table tbody tr');
            } else {
                clearRows = document.querySelectorAll('#' + timeFrame + '_table tbody tr');
            }
            for (let clearRow of clearRows) {
                clearRow.classList.remove('dragover');
            }
            eventTracking("drag end", "layout", "table layout");
        });

        row.addEventListener('drop', function (e) {
            e.stopPropagation();
            let thisCharacter = this.closest('table').dataset.character;

            //save the order
            let csv = [];
            let rows;
            if (thisCharacter != null) {
                rows = document.querySelectorAll('#' + thisCharacter + '_' + timeFrame + '_table tbody tr');
            } else {
                rows = document.querySelectorAll('#' + timeFrame + '_table tbody tr');
            }
            for (let row of rows) {
                csv.push(row.dataset.task);
            }

            if (thisCharacter != null) {
                storage.setItem(thisCharacter + '-' + timeFrame + '-order', csv.join(','));
            } else {
                storage.setItem(timeFrame + '-order', csv.join(','));
            }

            return false;
        });
    }
};

/**
 * Takes a timeframe name and clear the associated localstorage and toggle the html data off
 * @param {String} timeFrame
 * @param {Boolean} html change the data on the element or not
 */
const resetTable = function (timeFrame, html, char) {
    profilePrefix = char;
    let tableRows = document.querySelectorAll('#' + timeFrame + '_table tbody tr input');
	let tableRowsFront = document.querySelectorAll('#' + timeFrame + '_table tbody tr');
 
	for (let rowTarget of tableRowsFront) {
		rowTarget.dataset.completed = false;
    }
	
    for (let rowTarget of tableRows) {
        rowTarget.checked =false;
        storage.setItem(rowTarget.id + rowTarget.name, false);
    }

    if (profilePrefix != null) {
        storage.removeItem(profilePrefix + '-' + timeFrame + '-updated');
    } else {
        storage.removeItem(timeFrame + '-updated');
    }
};

/**
 * Attach event listener to button for resetting table
 * @param {String} timeFrame
 */
const resettableSection = function (timeFrame, char) {
    profilePrefix = char;
    let data = window[timeFrame];
    let resetButton;

    resetButton = document.querySelector('#' + timeFrame + '_reset_button');

    resetButton.addEventListener('click', function () {
        for (let taskSlug in data) {
            let itemState = storage.getItem(taskSlug) ?? 'false';
            if (itemState === 'hide') {
                storage.removeItem(taskSlug);
            }
        }
        
        let thisCharacter = this.closest('table').dataset.character;
        resetTable(timeFrame, false, thisCharacter);
        eventTracking("reset", "layout", timeFrame + '-order');
        storage.removeItem(timeFrame + '-order');
        storage.removeItem('pos_' + timeFrame);
        window.location.reload();
    });
};

/**
 * Attach event listener for hiding/unhiding table
 * @param {String} timeFrame
 */
const hidableSection = function (timeFrame, char) {
    profilePrefix = char;
    let hideButton;
    let unhideButton;
    let hideTable;

    if (profilePrefix != null) {
        hideButton = document.querySelector('#' + profilePrefix + '_' + timeFrame + '_hide_button');
        unhideButton = document.querySelector('#' + profilePrefix + '_' + timeFrame + '_unhide_button');
    } else {
        hideButton = document.querySelector('#' + timeFrame + '_hide_button');
        unhideButton = document.querySelector('#' + timeFrame + '_unhide_button');
    }

    hideButton.addEventListener('click', function () {
        let thisCharacter = this.closest('table').dataset.character;
        if (thisCharacter != null) {
            hideTable = document.querySelector('div.' + thisCharacter + '_' + timeFrame + '_table');
            hideTable.dataset.hide = 'hide';
            eventTracking("hide", "layout", thisCharacter + '-' + timeFrame + '-hide');
            storage.setItem(thisCharacter + '-' + timeFrame + '-hide', 'hide');
        } else {
            hideTable = document.querySelector('div.' + timeFrame + '_table');
            hideTable.dataset.hide = 'hide';
            eventTracking("hide", "layout", timeFrame + '_table');
            storage.setItem(timeFrame + '-hide', 'hide');
        }
    });

    unhideButton.addEventListener('click', function () {
        let thisCharacter = this.closest('table').dataset.character;
        if (thisCharacter != null) {
            hideTable = document.querySelector('div.' + thisCharacter + '_' + timeFrame + '_table');
            hideTable.dataset.hide = '';
            eventTracking("unhide", "layout", thisCharacter + '-' + timeFrame + '-hide');
            storage.removeItem(thisCharacter + '-' + timeFrame + '-hide');
        } else {
            hideTable = document.querySelector('div.' + timeFrame + '_table');
            hideTable.dataset.hide = '';
            eventTracking("unhide", "layout", timeFrame + '_table');
            storage.removeItem(timeFrame + '-hide');
        }

    });
};

const getTimezone = function(){
	const timezone = document.getElementById('timezone');
	return parseInt(timezone.value);
}

const updateTimeContent = function(){
    let serverTime = new Date();
    serverTime.setHours(serverTime.getUTCHours() + -(getTimezone()-3))
    for (countdownElement of document.querySelectorAll('p.opencountdown')){
        let splittedId = countdownElement.dataset.time.split("-");

        if (countdownElement.dataset.day !== "undefined"){
            let openDays = countdownElement.dataset.day.split("-");
            var currentDay = serverTime.getDay();
            if (!openDays.includes(String(currentDay))) {
                //skip if not open on current day
                countdownElement.textContent = "Closed for today" //todo: set actual time
                continue;
            }
        }
        
        for (openTime of splittedId){
            let startTime = new Date();
            startTime.setHours(openTime);
            startTime.setMinutes(0);
            startTime.setSeconds(0);

            let endTime = new Date();
            let duration = parseInt(countdownElement.dataset.duration);
            endTime.setHours(startTime.getHours() + duration);
            endTime.setMinutes(0);
            endTime.setSeconds(0);

            if((serverTime.getTime() >= startTime.getTime() && serverTime.getTime() <= endTime.getTime() )){
                let remainingtime = (endTime.getTime() - serverTime.getTime()) / 1000;
                let timeparts = [
                    Math.floor(remainingtime / 86400), //d
                    Math.floor(remainingtime % 86400 / 3600), //h
                    Math.floor(remainingtime % 3600 / 60), //m
                    Math.floor(remainingtime % 60) //s
                ];
                countdownElement.textContent ="Closes in: " + (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
                break;
            } else{

                let remainingtime = (startTime.getTime() - serverTime.getTime()) / 1000;
                let timeparts = [
                    Math.floor(remainingtime / 86400), //d
                    Math.floor(remainingtime % 86400 / 3600), //h
                    Math.floor(remainingtime % 3600 / 60), //m
                    Math.floor(remainingtime % 60) //s
                ];

                if(remainingtime > 0){
                    countdownElement.textContent ="Opens in: " + (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
                    break;
                }
                else {
                    countdownElement.textContent = "Closed for today" //todo: set actual time
                }
            }
        }
    }
}


/**
 * Check if last updated timestamp for a timeframe is less than
 * the last reset for that timeframe if so reset the category
 * @param {String} timeFrame
 * @returns
 */
const checkReset = function (timeFrame, char) {
    profilePrefix = char;
    const resetHour = getTimezone();
    const resetday = 1;
    let tableUpdateTime;

    if (profilePrefix != null) {
        tableUpdateTime = storage.getItem(profilePrefix + '-' + timeFrame + '-updated') ?? 'false';
    } else {
        tableUpdateTime = storage.getItem(timeFrame + '-updated') ?? 'false';
    }
    
    updateTimeContent();

    if (tableUpdateTime === 'false') {
        return false;
    }
    
    let updateTime = new Date(parseInt(tableUpdateTime));

    let nextdate = new Date();
    nextdate.setUTCHours(resetHour);
    nextdate.setUTCMinutes(0);
    nextdate.setUTCSeconds(0);

    //check lastupdated < last weekly reset
    if (timeFrame == 'weeklies') {
        let weekmodifier = (7 - resetday + nextdate.getUTCDay()) % 7;
        nextdate.setUTCDate(nextdate.getUTCDate() - weekmodifier);
    } else if (timeFrame == 'monthlies') {
        nextdate.setUTCDate(1);
    }

    // Checking for the update for the daily timeframe is a little more complex because 
    // originally we pulled this from RS, this expects that if the new day has happened 
    // its reset time, but we need to allow some freedom between 0 - 10am UTC (resetTime).
    const isAfterReset = new Date().getUTCHours() >= resetHour;
    const isAfterWeeklyReset = new Date().getUTCDay() >= resetday;
    if ((updateTime.getUTCHours() < resetHour || nextdate.getUTCHours() == resetHour) && updateTime.getTime() < nextdate.getTime() && isAfterReset) {
        if ((timeFrame == 'weeklies') && (updateTime.getUTCDay() < resetday || nextdate.getUTCDay() == resetday) && isAfterWeeklyReset) {
            resetTable(timeFrame, true, profilePrefix);
        } else if (timeFrame == 'dailies' || timeFrame == 'dailydrops' || timeFrame == 'immortaldailies' ) {
            resetTable(timeFrame, true, profilePrefix);
        } else if (timeFrame == 'monthlies') {
            resetTable(timeFrame, true, profilePrefix);
        } else {
            return;
        }
    }
};

/**
 * Add a countdown timer until the next reset for a timeframe
 * @param {String} timeFrame
 */
const countDown = function (timeFrame) {
    const resetHour = getTimezone();
    const resetday = 1; // Monday
    const isAfterDailyReset = new Date().getUTCHours() >= resetHour;
    const isAfterWeeklyReset = new Date().getUTCDay() == resetday;

    let nextdate = new Date();

	if (timeFrame == 'monthlies') {
        nextdate.setUTCHours(resetHour);
        nextdate.setUTCMinutes(0);
        nextdate.setUTCSeconds(0);
        nextdate.setUTCMonth(nextdate.getUTCMonth() + 1);
        nextdate.setUTCDate(1);
    } else if (timeFrame == 'weeklies') {
        nextdate.setUTCHours(resetHour);
        nextdate.setUTCMinutes(0);
        nextdate.setUTCSeconds(0);
        let weekmodifier = (7 + resetday - nextdate.getUTCDay()) % 7;
        nextdate.setUTCDate(nextdate.getUTCDate() + weekmodifier);
        if (isAfterWeeklyReset && isAfterDailyReset) {
            nextdate.setUTCDate(nextdate.getUTCDate() + 7);
        }
    } else if (timeFrame == 'dailies' || timeFrame == 'dailydrops' || timeFrame == 'immortaldailies') {
        nextdate.setUTCHours(resetHour);
        nextdate.setUTCMinutes(0);
        nextdate.setUTCSeconds(0);
        
        if (isAfterDailyReset) {
            let day = 1;
            if (resetHour < 0){
                day = 2;//OC / Asia
            }
            nextdate.setUTCDate(nextdate.getUTCDate() + day);
            
            let now = new Date();
            let timeCheck = (nextdate.getTime() - now.getTime()) / 1000;
            if (Math.floor(timeCheck / 86400) > 0){
                nextdate.setUTCDate(nextdate.getUTCDate() - 1);
            }
        }
    }

    let nowtime = new Date();
    let remainingtime = (nextdate.getTime() - nowtime.getTime()) / 1000;
    let timeparts = [
        Math.floor(remainingtime / 86400), //d
        Math.floor(remainingtime % 86400 / 3600), //h
        Math.floor(remainingtime % 3600 / 60), //m
        Math.floor(remainingtime % 60) //s
    ];
	
	if (timeFrame == 'dailydrops'){
        document.getElementById('th-countdown-' + timeFrame).innerHTML = (timeparts[0] > 0 ? (timeparts[0] + 'd ') : '') + (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
    }

	if (timeFrame == 'immortaldailies'){
        document.getElementById('th-countdown-' + timeFrame).innerHTML = (timeparts[0] > 0 ? (timeparts[0] + 'd ') : '') + (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
    }

    if (timeFrame == 'weeklies' || timeFrame == 'monthlies') {
        document.getElementById('countdown-' + timeFrame).innerHTML = (timeparts[0] > 0 ? (timeparts[0] + 'd ') : '0d ') + (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
        document.getElementById('th-countdown-' + timeFrame).innerHTML = (timeparts[0] > 0 ? (timeparts[0] + 'd ') : '0d ') + (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
    } 
    
    if (timeFrame == 'dailies') {
        document.getElementById('countdown-' + timeFrame).innerHTML = (timeparts[0] > 0 ? (timeparts[0] + 'd ') : '') + (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
        document.getElementById('th-countdown-' + timeFrame).innerHTML = (timeparts[0] > 0 ? (timeparts[0] + 'd ') : '') + (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
    }
};

const populateNavigation = function (index, character) {
    let navigation = document.getElementById('character_dropdown');
    charNavigation = '';
    if (index > 0) {
        charNavigation += '<div class="dropdown-divider"></div>';
    }
    charNavigation += '<h6 class="dropdown-header nav-char">' + character + '</h6>';

    navigation.innerHTML += charNavigation;
}

const layouts = function () {
    const layoutButton = document.getElementById('compact-button');
    let currentLayout = storage.getItem('current-layout') ?? 'default';
    if (currentLayout !== 'default') {
        document.body.classList.add('compact');
        layoutButton.innerHTML = '⊞<span class="expanding_text">&nbsp;Full Mode</span>';
    }

    layoutButton.addEventListener('click', function (e) {
        e.preventDefault();

        let setLayout = document.body.classList.contains('compact') ? 'compact' : 'default';

        if (setLayout == 'default') {
            eventTracking("set layout", "layout", "compact");
            storage.setItem('current-layout', 'compact');
            document.body.classList.add('compact');
            layoutButton.innerHTML = '⊞<span class="expanding_text">&nbsp;Full Mode</span>';
        } else {
            eventTracking("set layout", "layout", "default");
            storage.removeItem('current-layout');
            document.body.classList.remove('compact');
            layoutButton.innerHTML = '⊟<span class="expanding_text">&nbsp;Compact Mode</span>';
        }

        window.location.reload();
    });
};

const positions = function () {
    keys = Object.keys(localStorage), i = keys.length;
    while (i--) {
        var item = keys[i];
        if (item.startsWith('pos_')) {
            var element = document.getElementById(item.substring(4))
            if (element != null) {
                element.style.transform = localStorage.getItem(keys[i])
            }
        }
    }
}

const resetPositions = function () {
    const layoutButton = document.getElementById('layout-button');
    layoutButton.addEventListener('click', function (e) {
        e.preventDefault();
        eventTracking("reset", "layout", "");
        keys = Object.keys(localStorage), i = keys.length;

        // Positions
        while (i--) {
            var item = keys[i];
            if (item.startsWith('pos_')) {
                localStorage.removeItem(item);
            }
        }

        for (const timeFrame of timeframesRoster) {
            tableRows = document.querySelectorAll('#' + timeFrame + '_table tbody tr input');
            for (let rowTarget of tableRows) {
                rowTarget.checked =false;
                storage.setItem(rowTarget.id + rowTarget.name, false);
            }
            storage.removeItem(timeFrame + '-updated');
        }

        window.location.reload();
    });
}

/**
 * Track events with google analytics
 * @param {string} action of the event
 * @param {string} category of the event
 * @param {string} label optional extra information about the event
 */
const eventTracking = function (action, category, label) {
    gtag('event', action, {
        'event_category': category,
        'event_label': label
    });
};


const themeSwitcher = function(state) {
    for (const switcher of document.querySelectorAll('.theme-switch')){
        switcher.checked = state;
    }
}

window.onload = function () {
    layouts();
    positions();
    resetPositions();

	const timezone = document.getElementById('timezone');
	 if (localStorage.getItem('timezone') !== null) {
        timezone.value = localStorage.getItem('timezone');
	 } else {
		 localStorage.setItem('timezone', 10);
	 }
	
	timezone.addEventListener('change', function (e) {
		localStorage.setItem('timezone', timezone.value);
    });

    for (const timeFrame of timeframesRoster) {
        populateTable(timeFrame, null);
        draggableTable(timeFrame, null);
        checkReset(timeFrame, null);
        resettableSection(timeFrame, null);
        hidableSection(timeFrame, null);
        countDown(timeFrame);
    }

    tableEventListeners();

    const themeSwitch = document.querySelector('.main-switch');

    if (localStorage.getItem('switchedTheme') !== null) {
        themeSwitch.checked = localStorage.getItem('switchedTheme') === 'true';
        themeSwitcher(true);
    }else{
        themeSwitcher(false);
    }

    themeSwitch.addEventListener('change', function (e) {
        if (e.currentTarget.checked === true) {
            // Add item to localstorage
            localStorage.setItem('switchedTheme', 'true');
            themeSwitcher(true);
        } else {
            // Remove item if theme is switched back to normal
            localStorage.removeItem('switchedTheme');
            themeSwitcher(false);
        }
    });

    setInterval(function () {
        for (const timeFrame of timeframesRoster) {
            checkReset(timeFrame);
            countDown(timeFrame);
        }
       
    }, 1000);
};
