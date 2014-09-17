/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
"use strict";
var ajax = ajax || {
    /**
     Create a XHR Object.
     IE Compat code removed.
     */
    ajaxRequest: function() {
	if (window.XMLHttpRequest) {//every sane browser, ever.
	    return new XMLHttpRequest();
	}
	return false;
    },
    /**
     Make an asynchronous GET request
     Calls /readyfunc/ with the request as parameter upon completion (readyState == 4)
     */
    asyncGet: function(url, readyfunc, errfunc, user, pass) {
	var request = new this.ajaxRequest();
	request.onreadystatechange =
		function() {
		    if (request.readyState == 4) {
			readyfunc(request);
		    }
		};

	request.open("GET", url, true, user, pass);
	try {
	    request.send(null);
	}
	catch (e) {
	    errfunc(e);
	}
	return request;
    },
    /**
     Make an asynchronous POST request
     Calls /readyfunc/ with the request as parameter upon completion (readyState == 4)
     
     /payload/ should contain the data to be POSTed in the format specified by contentType,
     by defualt form-urlencoded
     
     
     */
    asyncPost: function(url, payload, readyfunc, errfunc, contentType, user, pass) {
	contentType = contentType || "application/x-www-form-urlencoded";

	var request = new this.ajaxRequest();
	request.onreadystatechange =
		function() {
		    if (request.readyState == 4) {
			readyfunc(request);
		    }
		};

	request.open("POST", url, true, user, pass);
	request.setRequestHeader("Content-type", contentType);
	try {
	    request.send(payload);
	}
	catch (e) {
	    errfunc(e);
	}
	return request;
    },
    /**
     Perform a synchronous GET request
     This function does not do any error checking, so exceptions might
     be thrown.
     */
    syncGet: function(url, user, pass) {
	var request = new this.ajaxRequest();
	request.open("GET", url, false, user, pass);
	request.send(null);
	return request;
    },
    /**
     Perform a synchronous POST request, with /payload/
     being the data to POST in the specified format (default: form-urlencoded)
     */
    syncPost: function(url, payload, contentType, user, pass) {
	contentType = contentType || "application/x-www-form-urlencoded";

	var request = new this.ajaxRequest();
	request.open("POST", url, false, user, pass);
	request.setRequestHeader("Content-type", contentType);
	request.send(payload);
	return request;
    }
};

var gui = gui || {
    elem: function(elem) {
	return document.getElementById(elem);
    },
    create: function(tag) {
	return document.createElement(tag);
    },
    createColumn: function(content, id) {
	var col = this.create('td');
	col.setAttribute('id', id);
	col.textContent = content;
	return col;
    }
};

var tools = tools || {
};


