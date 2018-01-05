var poczoneBase = "https://poczone.net/backend/";
var sessionToken = null;
var pending = 0;
var async = true;

var onBusyChanged = [];
var onBeforeCallback = [];
var onAfterCallback = [];

var com = module.exports = {
	send: send,
	setSessionToken: setSessionToken,
	getPoczoneBase: getPoczoneBase,
	addBusyChangedListener: addBusyChangedListener,
	addBeforeCallbackListener: addBeforeCallbackListener,
	addAfterCallbackListener: addAfterCallbackListener,
	isBusy: isBusy,
	setAsync: setAsync
};

function send(endpoint, params, callback) {	
	var http = new XMLHttpRequest();
	http.open("POST", poczoneBase + endpoint, async);
	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
	http.onreadystatechange = function() {
		if (http.readyState == 4) {
			markReady();

			var response = parseResponse(http.responseText);

			fireCallbackListeners(onBeforeCallback, endpoint, params, response);
			callback(response);
			fireCallbackListeners(onAfterCallback, endpoint, params, response);
		}
	};
	
	var payload = buildFormData(patchParams(params));		
	http.send(payload);
	markBusy();
}

function patchParams(params) {
	if(params.sessionToken != null && sessionToken != null) {
		params.sessionToken = sessionToken;
	}
	return params;
}

function buildFormData(params) {	
	var data = "";
	for (var key in params) {
		var value = params[key];
		data += (data != "" ? "&" : "") + key + "=" + encodeURIComponent(value);
	}
	return data;
}

function parseResponse(text) {
	var json = null;
	try {
		json = JSON.parse(text);
		if(json !== null && typeof json.success !== "boolean") {
			json = null;
		}
	} catch(e) {
	}
	
	if(json == null) {
		json = {
			success: false,
			errors: [{
				httpCode: 0,
				code: "COMMUNICATION_ERROR",
				message: { de:"Kommunikationsfehler", en:"Commuication error" }
			}]
		}; 
	}
	
	return json;
}

function setSessionToken(newSessionToken) {
	sessionToken = newSessionToken;
}

function getPoczoneBase() {
	return poczoneBase;
}

function addBusyChangedListener(listener) {
	onBusyChanged.push(listener);
}

function addBeforeCallbackListener(listener) {
	onBeforeCallback.push(listener);
}

function addAfterCallbackListener(listener) {
	onAfterCallback.push(listener);
}

function fireCallbackListeners(listeners, endpoint, params, response) {
	listeners.forEach(function(listener) {
		listener(endpoint, params, response);
	});
}

function markBusy() {
	pending ++;
	if(pending == 1) {
		fireBusyChanged(true);
	}
}

function markReady() {
	pending --;
	if(pending == 0) {
		fireBusyChanged(false);
	}
}

function fireBusyChanged(busy) {
	onBusyChanged.forEach(function(listener) {
		listener(busy);
	});
}

function isBusy() {
	return pending > 0;
}

function setAsync(newAsync) {
	async = newAsync;
}