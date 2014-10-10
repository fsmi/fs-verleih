/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var fsmi = fsmi || {};

fsmi.menu = {
    MENU: [
	"overviewDiv",
	"borrowDiv",
	"allowDiv",
	"giveDiv",
	"getDiv"
    ],
    changeTo: function (elem) {
	this.MENU.forEach(function (val) {
	    gui.elem(val).style.display = "none";
	});
	gui.elem(elem).style.display = "block";
    },
    parseHash: function () {
	var hash = window.location.hash;

	this.MENU.forEach(function (val) {
	    if (hash === "#" + val.slice(0, -3)) {
		fsmi.menu.changeTo(val);
		return;
	    }
	});
    }
}

fsmi.verleih = {
    secret: "",
    url: "../backend/db.php",
    matInfoCounter: 0,
    calendar: new Calendar('calendar_borrow_div'),
    fsid: 112,
    stuff: [],
    availStuff: [],
    events: [],
    STATES: {
	INCOMING: {id: 1, text: "Eingegangen"},
	ACCEPTED: {id: 2, text: "Akzeptiert"},
	OUT: {id: 3, text: "Ausgeliehen"},
	FINISHED: {id: 4, text: "Zurückgegeben"},
	REJECTED: {id: -1, text: "Zurückgewiesen"},
	byId: function (id) {
	    switch (id) {
		case 1:
		    return this.INCOMING;
		case 2:
		    return this.ACCEPTED;
		case 3:
		    return this.OUT;
		case 4:
		    return this.FINISHED;
		case -1:
		    return this.REJECTED;
		default:
		    return null;
	    }
	},
	toText: function (id) {
	    switch (id) {
		case 1:
		    return this.INCOMING.text;
		case 2:
		    return this.ACCEPTED.text;
		case 3:
		    return this.OUT.text;
		case 4:
		    return this.FINISHED.text;
		case -1:
		    return this.REJECTED.text;
		default:
		    return "";
	    }
	},
	finishEvent: function (id) {
	    this.eventStateChange(fsmi.verleih.url + "?finish-event", id);
	},
	allowEvent: function (id) {
	    this.eventStateChange(fsmi.verleih.url + "?allow-event", id);
	},
	rejectEvent: function (id) {
	    this.eventStateChange(fsmi.verleih.url + "?reject-event", id);
	},
	outEvent: function (id) {
	    this.eventStateChange(fsmi.verleih.url + "?out-event", id);
	},
	eventStateChange: function (url, id) {
	    ajax.asyncPost(url, JSON.stringify({
		id: id,
		secret: fsmi.verleih.mySecret
	    }), function (xhr) {
		console.log(xhr.response);
		fsmi.verleih.hideDetails();
		gui.elem('eventListBody').innerHTML = "";
		fsmi.verleih.getEventsFromServer(fsmi.verleih.fillEvents);
	    });
	}
    },
    event: {
	showEvent: function (evt) {
	    console.log(evt);
	    var event = evt.detail;
	    fsmi.verleih.detail(event.id);
	}
    },
    fillAllowEventList: function (events) {

	var selector = gui.elem("allowEventSelector");

	var empty = gui.create('option');
	empty.setAttribute('value', -1);
	selector.appendChild(empty);

	events.forEach(function (val) {

	    if (val.state === 1) {
		var option = gui.create('option');
		option.setAttribute('value', val.id);
		option.textContent = val.name +
			" (" +
			moment(val.start).format("YYYY-MM-DD") +
			" - " +
			moment(val.end).format("YYYY-MM-DD")
			+ ")";
		selector.appendChild(option);
	    }
	});

    },
    allowSelectorChange: function () {
	var elem = gui.elem("allowEventSelector");
	var id = elem[elem.selectedIndex].value


	var div = gui.elem("allowDivEventDetails");

	this.getEventDetails(id, function (xhr) {
	    var event = JSON.parse(xhr.response).details[0];

	    div.innerHTML = "";
	    div.appendChild(gui.createText("ID: " + event.id));
	    div.appendChild(gui.createText("Name: " + event.name));
	    div.appendChild(gui.createText("Kommentar: " + event.comment));
	    div.appendChild(gui.createText("Wer: " + event.contact));
	    div.appendChild(gui.createText("Fachschaftscontact: " + event.fscontact));
	    div.appendChild(gui.createText(
		    "Zeitraum: " + 
		    moment(event.start).format("YYYY-MM-DD HH:mm")
		    + " - "
		    + moment(event.end).format("YYYY-MM-DD HH:mm")));
	    div.appendChild(gui.createText("Was: "));
	    var xhr = ajax.syncGet(fsmi.verleih.url + "?stuff&id=" + id);

	    var stuff = JSON.parse(xhr.response).stuff;

	    var ul = gui.create('ul');

	    stuff.forEach(function (val) {
		var elem = gui.create('li');
		elem.textContent = val.count + "x " + val.name;


		ul.appendChild(elem);
	    });
	    div.appendChild(ul);
	});



    },
    detail: function (id) {
	this.getDetails(id);
	gui.elem('detail').style.display = "block";
	gui.elem('detailEventContent').style.display = "block";
	gui.elem('detailStuffContent').style.display = "none";
	gui.elem('background').style.display = "block";
    },
    getEventDetails: function (id, callback) {
	ajax.asyncGet(this.url + "?details&id=" + id, callback);
    },
    getDetails: function (id) {
	var xhr = ajax.syncGet(this.url + "?details&id=" + id);

	var details = JSON.parse(xhr.response).details[0];
	console.log(details);
	gui.elem('detailEvent').textContent = details.name;
	gui.elem('detailComment').textContent = details.comment;
	gui.elem('detailID').textContent = details.id;
	gui.elem('detailFSContact').textContent = details.fscontact;
	gui.elem('detailContact').textContent = details.contact;
	gui.elem('detailTime').textContent = moment.unix(details.start).format("DD.MM.YYYY HH:MM")
		+ " - " + moment.unix(details.end).format("DD.MM.YYYY HH:MM");
	gui.elem('detailStatus').textContent = this.STATES.toText(details.state);

	xhr = ajax.syncGet(this.url + "?stuff&id=" + id);

	var stuff = JSON.parse(xhr.response).stuff;
	var list = gui.elem('detailStuffList');
	list.innerHTML = "";
	stuff.forEach(function (val) {
	    var elem = gui.create('li');
	    elem.textContent = val.count + "x " + val.name;

	    list.appendChild(elem);
	});

	var nav = gui.elem('customDetailNav');
	nav.innerHTML = "";
	if (details.state === 1) {
	    nav.appendChild(
		    gui.createButton("Allow", function () {
			fsmi.verleih.STATES.allowEvent(details.id);
		    }));
	    nav.appendChild(
		    gui.createButton(
			    "Reject", function () {
				fsmi.verleih.STATES.rejectEvent(details.id);
			    }));
	} else if (details.state === 2) {
	    nav.appendChild(
		    gui.createButton("Out", function () {
			fsmi.verleih.STATES.outEvent(details.id);
		    }));
	} else if (details.state === 3) {
	    nav.appendChild(
		    gui.createButton("Finish", function () {
			fsmi.verleih.STATES.finishEvent(details.id);
		    }));
	}
    },
    fillEvents: function (rawEvents) {

	var events = JSON.parse(rawEvents.response).events;

	var tbody = gui.elem('eventListBody');
	fsmi.verleih.calendar.clear();
	events.forEach(function (val) {

	    var row = gui.create('tr');
	    row.appendChild(gui.createColumn(val.id, 'event' + val.id));
	    row.appendChild(gui.createColumn(val.name));
	    row.appendChild(gui.createColumn(val.contact));
	    row.appendChild(gui.createColumn(val.stuff));
	    row.appendChild(gui.createColumn(moment.unix(val.start).format("DD.MM.YYYY HH:MM")
		    + " - " + moment.unix(val.end).format("DD.MM.YYYY HH:MM")));
	    row.appendChild(gui.createColumn(fsmi.verleih.STATES.toText(val.state)));

	    var detailElem = gui.create('td');
	    detailElem.setAttribute('id', 'detail' + val.id);
	    detailElem.classList.add('detail');
	    detailElem.setAttribute('onclick', 'fsmi.verleih.detail(' + val.id + ')');
	    detailElem.textContent = "[details]";
	    row.appendChild(detailElem);

	    tbody.appendChild(row);
	    fsmi.verleih.calendar.add(val);
	});
	fsmi.verleih.fillAllowEventList(events);
	this.events = events;
    },
    fillStuff: function (xhr) {
	var stuffList = JSON.parse(xhr.response).stufflist;

	var tbody = gui.elem('stuffListBody');

	stuffList.forEach(function (val) {
	    var row = gui.create('tr');
	    row.appendChild(gui.createColumn(val.id, 'stuff' + val.id));
	    row.appendChild(gui.createColumn(val.name));
	    row.appendChild(gui.createColumn(val.count));

	    var detailElem = gui.create('td');
	    detailElem.setAttribute('id', 'detail' + val.id);
	    detailElem.classList.add('detail');
	    detailElem.setAttribute('onclick', 'fsmi.verleih.detailStuff(' + val.id + ')');
	    detailElem.textContent = "[details]";
	    row.appendChild(detailElem);

	    var deleteElem = gui.create('td');
	    deleteElem.setAttribute('id', 'delete' + val.id);
	    deleteElem.classList.add('delete');
	    deleteElem.classList.add('button');
	    deleteElem.setAttribute('onclick', 'fsmi.verleih.deleteMaterial(' + val.id + ')');
	    deleteElem.textContent = "[x]";
	    row.appendChild(deleteElem);


	    tbody.appendChild(row);
	});
    },
    getEventsFromServer: function (callback) {
	ajax.asyncGet(this.url + "?events", callback);
    },
    getStuffFromServer: function (callback) {
	ajax.asyncGet(this.url + "?stufflist", callback);
    },
    getDetailsStuff: function (id) {
	var xhr = ajax.syncGet(this.url + "?stuffdetail&id=" + id);

	var stuff = JSON.parse(xhr.response).stuffdetail[0];

	gui.elem('detailStuffID').textContent = stuff.id;
	gui.elem('detailStuffName').textContent = stuff.name;
	gui.elem('detailStuffInternPrice').textContent = stuff.intern_price + " €";
	gui.elem('detailStuffExternPrice').textContent = stuff.extern_price + " €";
	gui.elem('detailStuffCount').textContent = stuff.count;

	xhr = ajax.syncGet(this.url + "?stuffinfo&id=" + id);

	var stuffInfo = JSON.parse(xhr.response).stuffinfo;

	var tbody = gui.elem('detailStuffInfos');
	tbody.innerHTML = "";
	stuffInfo.forEach(function (val) {
	    var tr = gui.create('tr');

	    tr.appendChild(gui.createColumn(val.key));

	    if (val.type === "picture") {
		var col = gui.create('td');
		var img = gui.create('img');
		img.setAttribute('src', val.value);
		img.setAttribute('width', "50%");
		col.appendChild(img);
		tr.appendChild(col);
	    } else {
		tr.appendChild(gui.createColumn(val.value));
	    }
	    tbody.appendChild(tr);
	});
    },
    detailStuff: function (id) {
	this.getDetailsStuff(id);
	gui.elem('detail').style.display = "block";
	gui.elem('detailStuffContent').style.display = "block";
	gui.elem('background').style.display = "block";
    },
    rangeSelected: function (event) {

	var start = event.detail.start;
	var end = event.detail.end;

	if (start.isAfter(event.detail.end)) {
	    end = event.detail.start;
	    start = event.detail.end;
	}

	gui.elem('eventFrom').value = start.format("YYYY-MM-DD HH:mm");
	gui.elem('eventTo').value = end.format("YYYY-MM-DD HH:mm");
    },
    init: function () {
	fsmi.menu.changeTo(fsmi.menu.MENU[0]);
	this.getEventsFromServer(fsmi.verleih.fillEvents);
	console.log("fillStuff");
	this.getStuffFromServer(fsmi.verleih.fillStuff);
	ajax.asyncGet(this.url + "?get-stuff", this.fillEventStuffList);
	document.body.addEventListener('calendar_range_selected', fsmi.verleih.rangeSelected);
	document.body.addEventListener('calendar_event_clicked', fsmi.verleih.event.showEvent);
    },
    fillEventStuffList: function (xhr) {

	var stuff = JSON.parse(xhr.response).stuff;

	var list = gui.elem('eventStuffDataList');

	stuff.forEach(function (val) {
	    fsmi.verleih.availStuff[val.name] = val;
	    var option = gui.create('option');
	    option.setAttribute('value', val.name);
	    list.appendChild(option);
	});

    },
    hideDetails: function () {
	gui.elem('detail').style.display = "none";
	gui.elem('background').style.display = "none";
	gui.elem('detailEventContent').style.display = "none";
	gui.elem('detailStuffContent').style.display = "none";
	gui.elem('addMaterialContent').style.display = "none";
    },
    showMaterialDialog: function () {
	gui.elem('detail').style.display = "block";
	gui.elem('background').style.display = "block";
	gui.elem('addMaterialContent').style.display = "block";
	this.matInfoCounter = 0;
	gui.elem('addStuffInfos').innerHTML = "";
    },
    saveEvent: function () {

	var contact = {
	    name: gui.elem("eventPerson").value,
	    details: [
		{
		    key: "Mail",
		    value: gui.elem('contact_mail').value
		},
		{
		    key: "Phone",
		    value: gui.elem('contact_phone').value
		}
	    ]
	};

	var startTime = moment(gui.elem('eventFrom').value, "YYYY-MM-DD HH:mm");
	var endTime = moment(gui.elem('eventTo').value, "YYYY-MM-DD HH:mm");


	var outobject = {
	    contact: contact,
	    event: {
		start: startTime.format("X"),
		end: endTime.format("X"),
		fscontact: fsmi.verleih.fsid,
		comment: gui.elem("eventComment").value,
		name: gui.elem('eventName').value,
		stuff: fsmi.verleih.stuff
	    }

	};
	console.log(outobject);
	ajax.asyncPost(fsmi.verleih.url + "?add-event",
		JSON.stringify(outobject), function (xhr) {
	    console.log(JSON.parse(xhr.response));
	});

    },
    addStuffToEvent: function () {

	var name = gui.elem('eventStuffInput').value;

	var json = fsmi.verleih.availStuff[name];
	var item = gui.elem("event_stuff_list_item" + json.id);

	if (item) {

	    if (item.stuffCount <= json.count) {

		item.stuffCount++;
	    }
	} else {

	    item = gui.create('li');
	    item.setAttribute('id', "event_stuff_list_item" + json.id);
	    item.stuffCount = 1;
	    gui.elem('eventStuffList').appendChild(item);

	}
	item.textContent = item.stuffCount + "x " + json.name;
	fsmi.verleih.stuff.push(json);
    },
    addMaterial: function () {

	var stuffName = gui.elem('addStuffName').value;
	var intern_price = gui.elem('addStuffInternPrice').value;
	var extern_price = gui.elem('addStuffExternPrice').value;
	var count = gui.elem('addStuffCount').value;

	var infos = [];

	while (this.matInfoCounter > 0) {
	    var key = gui.elem('key' + this.matInfoCounter).value;
	    var value = gui.elem('value' + this.matInfoCounter).value;
	    var select = gui.elem('select' + this.matInfoCounter);
	    var type = select.options[select.selectedIndex].value;

	    if (key !== "") {
		var info = {
		    key: key,
		    value: value,
		    type: type
		}
		infos.push(info);
	    }
	    this.matInfoCounter--;
	}


	var matObject = {
	    name: stuffName,
	    intern_price: intern_price,
	    extern_price: extern_price,
	    count: count,
	    infos: infos
	}

	console.log(matObject);
	console.log(ajax.syncPost(this.url + "?add-material", JSON.stringify(matObject)));
	this.hideDetails();
	this.reload();
    },
    deleteMaterial: function (id) {

	if (confirm("Delete stuff with id: " + id + "?")) {

	    ajax.asyncPost(this.url + "?delete-material", JSON.stringify({
		id: id
	    }), function (xhr) {
		console.log(xhr.response);
		gui.elem('stuffListBody').innerHTML = "";
		fsmi.verleih.getStuffFromServer();
	    });

	}
    },
    reload: function () {
	gui.elem('stuffListBody').innerHTML = "";
	gui.elem('eventListBody').innerHTML = "";
	this.calendar.clear();
	this.init();
    },
    addInfoRow: function () {
	var tbody = gui.elem('addStuffInfos');
	var tr = gui.create('tr');
	this.matInfoCounter++;

	var keyRow = gui.create('td');
	var keyInput = gui.create('input');
	keyInput.setAttribute('type', 'text');
	keyInput.setAttribute('id', 'key' + this.matInfoCounter);
	keyRow.appendChild(keyInput);
	tr.appendChild(keyRow);

	var valueRow = gui.create('td');
	var valueInput = gui.create('input');
	valueInput.setAttribute('type', 'text');
	valueInput.setAttribute('id', 'value' + this.matInfoCounter);
	valueRow.appendChild(valueInput);
	tr.appendChild(valueRow);

	var typeRow = gui.create('td');
	var typeSelect = gui.create('select');
	typeSelect.setAttribute('id', 'select' + this.matInfoCounter);
	var option = gui.create('option');
	option.setAttribute("value", "text");
	option.textContent = "text";
	typeSelect.appendChild(option);
	option = gui.create('option');
	option.setAttribute("value", "picture");
	option.textContent = "picture";
	typeSelect.appendChild(option);
	typeRow.appendChild(typeSelect);

	tr.appendChild(typeRow);

	tbody.appendChild(tr);
    }
};
fsmi.verleih.init();