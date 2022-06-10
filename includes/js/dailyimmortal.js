const storage = window.localStorage;

const timeframesRoster = ['dailies', 'weeklies', 'monthlies'];

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

    const sampleRow = document.querySelector('#sample_row');
    if (profilePrefix != null) {
        table = document.getElementById(profilePrefix + '_' + timeFrame + '_table');
    } else {
        table = document.getElementById(timeFrame + '_table');

    }
    const tbody = table.querySelector('tbody');

    //Hidden table
    if (profilePrefix != null) {
        hideTable = storage.getItem(profilePrefix + '-' + timeFrame + '-hide') ?? 'false';
    } else {
        hideTable = storage.getItem(timeFrame + '-hide') ?? 'false';
    }

    if (hideTable == 'hide') {
        if (profilePrefix != null) {
            document.querySelector('div.' + profilePrefix + '_' + timeFrame + '_table').dataset.hide = 'hide';
        } else {
            document.querySelector('div.' + timeFrame + '_table').dataset.hide = 'hide';
        }

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
        let taskState;

        if (profilePrefix != null) {
            taskState = storage.getItem(profilePrefix + '-' + taskSlug) ?? 'false';
        } else {
            taskState = storage.getItem(taskSlug) ?? 'false';
        }

        newRow.dataset.task = taskSlug;

        if (!!data[taskSlug].url) {
            if (data[taskSlug].url !== "#") {
                newRowAnchor.href = data[taskSlug].url;
            }
        }

        if (!!data[taskSlug].img) {
            newRowAnchor.innerHTML = "<img class='icon' src='../includes/img/activities/" + data[taskSlug].img + ".png' alt=" + data[taskSlug].img + "/>" + data[taskSlug].task;
        } else {
            newRowAnchor.innerHTML = data[taskSlug].task
        }

        if (!!data[taskSlug].desc) {
            newRowColor.innerHTML =  data[taskSlug].desc.replace("{dust}", "<img class='icon' src='../includes/img/activities/dust.webp' alt=Dust/><b style="+"color:#ff0;"+">Enchanted Dust</b>");
        }

        tbody.appendChild(newRow);
        newRow.dataset.completed = taskState;
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

    for (let colorCell of rowsColor) {
        colorCell.addEventListener('click', function () {
            let thisTimeframe = this.closest('table').dataset.timeframe;
            let thisCharacter = this.closest('table').dataset.character;
            let thisRow = this.closest('tr');
            let taskSlug = thisRow.dataset.task;
            let newState = (thisRow.dataset.completed === 'true') ? 'false' : 'true'
            thisRow.dataset.completed = newState;
            if (newState === 'true') {
                if (thisCharacter != null) {
                    storage.setItem(thisCharacter + '-' + taskSlug, newState);
                } else {
                    storage.setItem(taskSlug, newState);
                }

            } else {
                if (thisCharacter != null) {
                    storage.removeItem(thisCharacter + '-' + taskSlug);
                } else {
                    storage.removeItem(taskSlug);
                }
            }
            if (thisCharacter != null) {
                storage.setItem(thisCharacter + '-' + thisTimeframe + '-updated', new Date().getTime());
            } else {
                storage.setItem(thisTimeframe + '-updated', new Date().getTime());
            }
            eventTracking("click", "slugs", thisCharacter + '-' + thisTimeframe);
        });

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
    let tableRows;
    if (profilePrefix != null) {
        tableRows = document.querySelectorAll('#' + profilePrefix + '_' + timeFrame + '_table tbody tr');
    } else {
        tableRows = document.querySelectorAll('#' + timeFrame + '_table tbody tr');
    }

    for (let rowTarget of tableRows) {
        let itemState;
        if (profilePrefix != null) {
            itemState = storage.getItem(profilePrefix + '-' + rowTarget.dataset.task) ?? 'false';
        } else {
            itemState = storage.getItem(rowTarget.dataset.task) ?? 'false';
        }

        if (itemState != 'hide') {
            if (html) {
                rowTarget.dataset.completed = false;
            }
            if (profilePrefix != null) {
                storage.removeItem(profilePrefix + '-' + rowTarget.dataset.task);
            } else {
                storage.removeItem(rowTarget.dataset.task);
            }
        }
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

    if (profilePrefix != null) {
        resetButton = document.querySelector('#' + profilePrefix + '_' + timeFrame + '_reset_button');
    } else {
        resetButton = document.querySelector('#' + timeFrame + '_reset_button');
    }

    resetButton.addEventListener('click', function () {
        let thisCharacter = this.closest('table').dataset.character;
        resetTable(timeFrame, false, thisCharacter);

        for (let taskSlug in data) {
            let itemState;
            if (profilePrefix != null) {
                itemState = storage.getItem(profilePrefix + '-' + taskSlug) ?? 'false';
            } else {
                itemState = storage.getItem(taskSlug) ?? 'false';
            }

            if (itemState == 'hide') {
                if (profilePrefix != null) {
                    storage.removeItem(profilePrefix + '-' + taskSlug);
                } else {
                    storage.removeItem(taskSlug);
                }
            }
        }
        if (profilePrefix != null) {
            eventTracking("reset", "layout", profilePrefix + '-' + timeFrame + '-order');
            storage.removeItem(profilePrefix + '-' + timeFrame + '-order');
            storage.removeItem('pos_' + profilePrefix + '_' + timeFrame + '_table');
        } else {
            eventTracking("reset", "layout", timeFrame + '-order');
            storage.removeItem(timeFrame + '-order');
            storage.removeItem('pos_' + timeFrame);
        }
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
        } else if (timeFrame == 'dailies' ) {
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
    } else if (timeFrame == 'dailies') {
        nextdate.setUTCHours(resetHour);
        nextdate.setUTCMinutes(0);
        nextdate.setUTCSeconds(0);
        if (isAfterDailyReset) {
            nextdate.setUTCDate(nextdate.getUTCDate() + 1);
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

    if (timeFrame == 'weeklies') {
        document.getElementById('countdown-' + timeFrame).innerHTML = (timeparts[0] > 0 ? (timeparts[0] + 'd ') : '0d ') + (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
    } else {
        document.getElementById('countdown-' + timeFrame).innerHTML = (timeparts[0] > 0 ? (timeparts[0] + 'd ') : '') + (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
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
            tableRows = document.querySelectorAll('#' + timeFrame + '_table tbody tr');
            for (let rowTarget of tableRows) {
                itemState = storage.getItem(rowTarget.dataset.task)
                if (itemState != 'hide') {
                    storage.removeItem(rowTarget.dataset.task);
                }
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
    console.log(themeSwitch);
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
