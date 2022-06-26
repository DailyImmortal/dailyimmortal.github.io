const getTimezone = function(){
	const timezone = document.getElementById('timezone');
	return parseInt(timezone.value);
}

const countDown = function () {
	let serverTime = new Date();
    serverTime.setHours(serverTime.getUTCHours() + -(getTimezone()-3));

	let elements = document.querySelectorAll("td.all-schedule-time");
	let currentDay = serverTime.getDay();

	let now = new Date();
	let timeCheck = (serverTime.getTime() - now.getTime()) / 1000;
	if (Math.floor(timeCheck / 86400) > 0){
		serverTime.setUTCDate(serverTime.getUTCDate() - 1);
	}
	
	document.getElementById('countdown-ST').innerHTML = serverTime.toLocaleString();
	
	for (let element of elements) {
		if (element.dataset.day === currentDay.toString()){
			let startTime = new Date();
			let hours = parseInt(element.dataset.hours);
			let minutes = parseInt(element.dataset.minutes);
			startTime.setHours(hours);
			startTime.setMinutes(minutes);
			startTime.setSeconds(0);
			
			if(serverTime.getTime() >= startTime.getTime()){
				element.innerHTML = element.dataset.hours + ":" + element.dataset.minutes
			} else{
				let remainingtime = (startTime.getTime() - serverTime.getTime()) / 1000;
				let timeparts = [
					Math.floor(remainingtime / 86400), //d
					Math.floor(remainingtime % 86400 / 3600), //h
					Math.floor(remainingtime % 3600 / 60), //m
					Math.floor(remainingtime % 60) //s
				];

				element.innerHTML  = (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
			}
		}
	}
}

window.onload = function () {
	const timezone = document.getElementById('timezone');
	 if (localStorage.getItem('timezone') !== null) {
        timezone.value = localStorage.getItem('timezone');
	 } else {
		 localStorage.setItem('timezone', 10);
	 }
	
	timezone.addEventListener('change', function (e) {
		localStorage.setItem('timezone', timezone.value);
		window.location.reload();
    });

    setInterval(function () {
       countDown();
    }, 1000);
};
