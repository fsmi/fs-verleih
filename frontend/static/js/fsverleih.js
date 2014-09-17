/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var fsmi = fsmi || {};

fsmi.verleih = {
    url: "../backend/db.php",
    matInfoCounter: 0,
    detail: function(id) {
	this.getDetails(id);
	gui.elem('detail').style.display = "block";
	gui.elem('detailEventContent').style.display = "block";
	gui.elem('detailStuffContent').style.display = "none";
	gui.elem('background').style.display = "block";
    },
    getDetails: function(id) {
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
	gui.elem('detailStatus').textContent = details.state;

	xhr = ajax.syncGet(this.url + "?stuff&id=" + id);

	var stuff = JSON.parse(xhr.response).stuff;
	console.log(stuff);
	var list = gui.elem('detailStuffList');
	list.innerHTML = "";
	stuff.forEach(function(val) {
	    var elem = gui.create('li');
	    elem.textContent = val.count + "x " + val.name;

	    list.appendChild(elem);

	});
    },
    fillEvents: function(rawEvents) {

	var events = JSON.parse(rawEvents.response).events;
	console.log(events);
	var tbody = gui.elem('eventListBody');
	events.forEach(function(val) {
	    console.log(val);
	    var row = gui.create('tr');
	    row.appendChild(gui.createColumn(val.id, 'event' + val.id));
	    row.appendChild(gui.createColumn(val.contact));
	    row.appendChild(gui.createColumn(val.stuff));
	    row.appendChild(gui.createColumn(moment.unix(val.start).format("DD.MM.YYYY HH:MM")
		    + " - " + moment.unix(val.end).format("DD.MM.YYYY HH:MM")));
	    row.appendChild(gui.createColumn(val.state));

	    var detailElem = gui.create('td');
	    detailElem.setAttribute('id', 'detail' + val.id);
	    detailElem.classList.add('detail');
	    detailElem.setAttribute('onclick', 'fsmi.verleih.detail(' + val.id + ')');
	    detailElem.textContent = "[details]";
	    row.appendChild(detailElem);

	    tbody.appendChild(row);
	});
    },
    fillStuff: function(xhr) {
	var stuffList = JSON.parse(xhr.response).stufflist;

	var tbody = gui.elem('stuffListBody');

	stuffList.forEach(function(val) {
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

	    tbody.appendChild(row);
	});
    },
    getEventsFromServer: function() {
	ajax.asyncGet(this.url + "?events", this.fillEvents);
    },
    getStuffFromServer: function() {
	ajax.asyncGet(this.url + "?stufflist", this.fillStuff);
    },
    getDetailsStuff: function(id) {
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
	stuffInfo.forEach(function(val) {
	    var tr = gui.create('tr');

	    tr.appendChild(gui.createColumn(val.key));

	    if (val.type == "picture") {
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
    detailStuff: function(id) {
	this.getDetailsStuff(id);
	gui.elem('detail').style.display = "block";
	gui.elem('detailStuffContent').style.display = "block";
	gui.elem('background').style.display = "block";
    },
    init: function() {
	this.getEventsFromServer();
	this.getStuffFromServer();
    },
    hideDetails: function() {
	gui.elem('detail').style.display = "none";
	gui.elem('background').style.display = "none";
	gui.elem('detailEventContent').style.display = "none";
	gui.elem('detailStuffContent').style.display = "none";
	gui.elem('addMaterialContent').style.display = "none";
    },
    showMaterialDialog: function() {
	gui.elem('detail').style.display = "block";
	gui.elem('background').style.display = "block";
	gui.elem('addMaterialContent').style.display = "block";
	this.matInfoCounter = 0;
	gui.elem('addStuffInfos').innerHTML = "";
    },
    addMaterial: function() {

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
    reload: function() {
	gui.elem('stuffListBody').innerHTML = "";
	gui.elem('eventListBody').innerHTML = "";
	this.init();
    },
    addInfoRow: function() {
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