/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
function Calendar(div, time) {

    if (!moment) {
	console.log("we want moment.js");
	return;
    }

    if (time) {
	this.time = moment(time, "X")
    } else {
	this.time = moment();
    }
    var displayDays = 7;
    var week = moment(this.time);
    var startTime, endTime;
    var selectMode = false;
    var selectedTiles = [];

    console.log(week);

    var days = {
	MONDAY: {id: 0, name: "Montag"},
	TUESDAY: {id: 1, name: "Dienstag"},
	WEDNESDAY: {id: 2, name: "Mittwoch"},
	THURSDAY: {id: 3, name: "Donnerstag"},
	FRIDAY: {id: 4, name: "Freitag"},
	SATURDAY: {id: 5, name: "Samstag"},
	SUNDAY: {id: 6, name: "Sonntag"},
	getElem: function(id) {
	    switch (id) {
		case this.MONDAY.id:
		    return this.MONDAY;
		case this.TUESDAY.id:
		    return this.TUESDAY;
		case this.WEDNESDAY.id:
		    return this.WEDNESDAY;
		case this.THURSDAY.id:
		    return this.THURSDAY;
		case this.FRIDAY.id:
		    return this.FRIDAY;
		case this.SATURDAY.id:
		    return this.SATURDAY;
		case this.SUNDAY.id:
		    return this.SUNDAY;
		default:
		    return null;
	    }
	},
	getName: function(id) {
	    return this.getElem(id).name;
	}
    }


    this.div = div;


    this.append = function(elem) {

    };
    this.remove = function(elem) {

    };
    this.createElement = function(title, start, end) {

	var divs = [];

	return {
	    elemente: divs,
	    title: title,
	    start: start,
	    end: end
	};


    }

    function mark() {

	if (!startTime || !endTime) {
	    return;
	}

	console.log(startTime.format("YYYY-MM-DD HH:mm")
		+ " - " + endTime.format("YYYY-MM-DD HH:mm"));

	var event = new CustomEvent(
		'calendar_range_selected', {detail: {
			start: startTime,
			end: endTime
		    }, bubbles: true});
	document.body.dispatchEvent(event);
    }

    function selectDay(day) {
	console.log(day);
	startTime = moment(week);
	startTime.day(day).hour(0).minute(0);
	endTime = moment(startTime).hour(23).minute(59);
	mark();
    }

    function getTimeFromElement(id) {
	var ssplit = id.split('#');
	var day = parseInt(ssplit[0]);
	var ssplit2 = ssplit[1].split(':');
	var hour = parseInt(ssplit2[0]);
	var minute = parseInt(ssplit2[1]) * 30;
	var date = moment(week);
	date.day(day).hour(hour).minute(minute);
	return date;
    }

    function clearSelected() {

	selectedTiles.forEach(function(val) {
	    console.log(val);
	    val.classList.remove('calendar_selected_halfhour');
	});
	selectedTiles = [];
    }

    function clearTextSelection() {
	if (window.getSelection) {
	    if (window.getSelection().empty) {  // Chrome
		window.getSelection().empty();
	    } else if (window.getSelection().removeAllRanges) {  // Firefox
		window.getSelection().removeAllRanges();
	    }
	} else if (document.selection) {  // IE?
	    document.selection.empty();
	}
    }

    function mouseUp(id) {
	selectMode = false;

	clearTextSelection();

	endTime = getTimeFromElement(id);
	mark();
    }

    function nextTileID(id) {

	var ssplit = id.split('#');
	var day = parseInt(ssplit[0]);
	var ssplit2 = ssplit[1].split(':');
	var hour = parseInt(ssplit2[0]);
	var minute = parseInt(ssplit2[1]);

	minute++;

	if (minute > 1) {
	    minute = 0;
	    hour++;

	    if (hour > 23) {
		hour = 0;
		day++;
	    }
	    if (day > displayDays - 1) {
		return "out_of_range";
	    }
	}

	return day + "#" + hour + ":" + minute;

    }

    function getTilesBetween(startTileID, endTileID, reverse) {

	var tiles = [];
	var counter = 0;

	do {


	    tiles[counter] = gui.elem('calendar_halfhour_' + startTileID);
	    tiles[counter].tileID = startTileID;
	    counter++;

	    startTileID = nextTileID(startTileID);

	    if (startTileID === "out_of_range") {
		return tiles;
	    }

	} while (startTileID !== endTileID);

	if (tiles[counter - 1].tileID !== endTileID) {
	    tiles[counter] = gui.elem('calendar_halfhour_' + endTileID);
	    tiles[counter].tileID = startTileID;
	}
	
	if (reverse) {
	    var startTile = tiles[counter];
	    tiles[counter] = tiles['0'];
	    tiles['0'] = startTile;
	}

	return tiles;

    }

    function tileIsAfter(firstTile, secondTile) {
	var firstTileSplit = firstTile.split('#');
	var secondTileSplit = secondTile.split('#');


	// day
	if (parseInt(firstTileSplit[0]) < parseInt(secondTileSplit[0])) {
	    return true;
	} else if (parseInt(firstTileSplit[0]) > parseInt(secondTileSplit[0])) {
	    return false;
	}
	    firstTileSplit = firstTileSplit[1].split(':');
	    secondTileSplit = secondTileSplit[1].split(':');
	
	// hour
	if (parseInt(firstTileSplit[0]) < parseInt(secondTileSplit[0])) {
	    return true;
	} else if (parseInt(firstTileSplit[0]) > parseInt(secondTileSplit[0])) {
	    return false;
	}
	
	// minute
	if (parseInt(firstTileSplit[1]) < parseInt(secondTileSplit[1])) {
	    return true;
	} else if (parseInt(firstTileSplit[1]) > parseInt(secondTileSplit[1])) {
	    return false;
	}
	return false;
    }

    function hover(id) {

	if (selectMode) {
	    var startTile = selectedTiles['0'];
	    clearSelected();

	    if (tileIsAfter(startTile.tileID, id)) {

		selectedTiles = getTilesBetween(startTile.tileID, id, 0);
	    } else {
		selectedTiles = getTilesBetween(id, startTile.tileID, 1);
	    }

	    selectedTiles.forEach(function(val) {
		val.classList.add('calendar_selected_halfhour');
	    });
	}
    }

    function mouseDown(id) {
	clearSelected();
	selectMode = true;
	selectedTiles['0'] = gui.elem('calendar_halfhour_' + id);
	selectedTiles['0'].classList.add('calendar_selected_halfhour');
	selectedTiles['0'].tileID = id;
	startTime = getTimeFromElement(id);
    }

    function createHalfHour(id, j) {
	var halfhour = gui.create('div');
	halfhour.setAttribute('id', 'calendar_halfhour_' + id);
	halfhour.classList.add('calendar_halfhour');
	//halfhour.classList.add('calendar_halfhour_' + j);
	halfhour.textContent = "";
	halfhour.addEventListener('mousedown', function() {
	    mouseDown(id);
	});
	halfhour.addEventListener('mouseup', function() {
	    mouseUp(id);
	});
	halfhour.addEventListener('mouseover', function() {
	    hover(id);
	});

	return halfhour;
    }

    function createDay(id) {

	var day = gui.create('div');
	day.classList.add('calendar_day');
	day.setAttribute('id', 'calendar_day' + id);

	for (var i = 0; i < 24; i++) {

	    for (var j = 0; j < 2; j++) {
		day.appendChild(createHalfHour(id + "#" + i + ":" + j, j));
	    }
	}

	return day;
    }

    function createTimeLineHalfHour(hh, mm) {
	var block = gui.create('div');
	block.classList.add('calendar_timeline_halfhour');
	block.classList.add('calendar_halfhour');
	block.classList.add('calendar_timeline_halfhour_' + mm);
	block.setAttribute('id', "calendar_timeline_hh_" + hh + ":" + mm);
	var span = gui.create('div');

	if (hh < 10) {
	    hh = "0" + hh;
	}
	if (mm < 10) {
	    mm = "0" + mm;
	}

	span.textContent = hh + ":" + mm;
	block.appendChild(span);

	return block;
    }

    function setWeekPlusDays(days) {
	week = moment(week).day(days);
	console.log(week.format("MM-DD"));
    }

    function actionBack() {
	setWeekPlusDays(-7);

	init(div);
    }

    function actionForward() {
	setWeekPlusDays(7);
	init(div);
    }

    function createTimeline() {

	var timeline = gui.create('div');
	timeline.classList.add('calendar_day');
	timeline.setAttribute('id', "calendar_timeline");

	for (var i = 0; i < 24; i++) {
	    for (var j = 0; j < 2; j++) {
		timeline.appendChild(createTimeLineHalfHour(i, 30 * j));
	    }
	}

	return timeline;
    }

    function reload() {
	init(div);
    }

    function setYearMonth(date) {
	week = moment(date);
	reload();
    }

    function createNav() {
	var nav = gui.create('div');
	nav.setAttribute('id', 'calendar_nav');

	nav.appendChild(gui.createButton("<", actionBack));
	var dateButton = gui.createButton(week.format("YYYY-MM"), null);

	new Pikaday({
	    field: dateButton,
	    onSelect: setYearMonth
	});

	nav.appendChild(dateButton);
	nav.appendChild(gui.createButton(">", actionForward));

	return nav;
    }

    function createHeader() {
	var header = gui.create('div');
	header.setAttribute('id', "calendar_header");

	header.appendChild(createNav());

	for (var i = 0; i < 7; i++) {

	    var day = gui.create('div');
	    day.classList.add('calendar_header_day');
	    day.textContent = days.getName(i) + " (" + moment(week).day(i).format("MM-DD") + ")";
	    day.valID = i;
	    day.addEventListener('click', function(evt) {
		selectDay(evt.target.valID);
	    });

	    header.appendChild(day);
	}

	return header;
    }

    function init(div) {
	var elem = gui.elem(div);
	elem.innerHTML = "";

	elem.appendChild(createHeader());

	var content = gui.create('div');
	content.setAttribute('id', "calendar_content");

	content.appendChild(createTimeline());

	for (var i = 0; i < displayDays; i++) {
	    content.appendChild(createDay(i));
	}
	elem.appendChild(content);

    }

    init(div);
}

