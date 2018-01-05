(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var com = require("./com");
var dom = require("./dom");

var dataToken = null;
var currSpaceID = null;

var appLauncher = module.exports = {
	close: close,
	launch: launch
};

function close() {
	var inapp = dom.get("inappFrameholder");
	inapp.innerHTML = "";

	if(dataToken) {
		com.send("data/token/revoke", { dataToken : dataToken}, function(result) {});
		dataToken = null;
	}
	currSpaceID = null;
}

function launch(space, app) {
	if(currSpaceID == space.spaceUUID) {
		return;
	}

	close();
	
	currSpaceID = space.spaceUUID;
	var inapp = dom.get("inapp-frameholder");

	var write = space.level == "ADMIN" || space.level == "WRITER";
	var params = { sessionToken: "", spaceUUID: space.spaceUUID, write: write };

	// TODO synchronizing	
	com.send("data/token/create", params, function(result) {
		if(result.success) {
			dataToken = result.dataToken;
			addIframe(app, dataToken);
		} else {
			currSpaceID = null;
		}
	});
}

function addIframe(app, dataToken) {
	var url = app.baseURL + "?dataToken=" + encodeURIComponent(dataToken) + "&base=" + encodeURIComponent(com.getPoczoneBase());
			
	var iframe = dom.create("iframe", "appframe");
	iframe.src = url;
	
	var inapp = dom.get("inappFrameholder");
	inapp.innerHTML = "";
	inapp.appendChild(iframe);
}
},{"./com":4,"./dom":5}],2:[function(require,module,exports){
var noop = "apps/noop/index.htm";
var nyiHint = " (NYI)";

var apps = [
	{
		id: "KANBAN",
		name: "Kanban Bubbles",
		info: "Simple Kanban Board to keep an overview",
		baseURL: "apps/kanban-bubbles/"
	}
	,{
		id: "GF",
		name: "Gedanken-Fetzen",
		info: "Undirected graph of text nodes, useful for quotes",
		baseURL: "apps/gedanken-fetzen/"
	}
	,{
		id: "DEMO",
		name: "API Demo",
		info: "Demo for the POCZone.net API concept",
		baseURL: noop
	}
	/*
	,{
		id: "DONE",
		name: "Done",
		info: "ToDo-List with nested entries" + nyiHint,
		baseURL: noop
	}
	,{
		id: "DIARY",
		name: "Diary",
		info: "Diary application with tagged notes" + nyiHint,
		baseURL: noop
	}
	*/
];

var appStore = module.exports = {
	getAll: function() {
		return apps;
	},
	getByID: function(appID) {
		return apps.filter(function(app) { return app.id==appID; })[0];
	}
};
},{}],3:[function(require,module,exports){
var com = require("./com");

var self = null;
var onIdentityChanged = [];
var wasLoggedInState = false;

var authManager = module.exports = {
	login: login,
	register: register,
	submitForm: submitForm,
	logout: logout,
	isLoggedIn: isLoggedIn,
	wasLoggedIn: wasLoggedIn,
	getSelf: getSelf,
	addIdentityChangedListener: addIdentityChangedListener
};

function login(username, password) {
	performAuthIn("auth/login", username, password);
}

function register(username, password) {
	performAuthIn("auth/register", username, password);
}

function submitForm(action, form) {
	performAuthIn("auth/"+action, form.username.value, form.password.value);
}

function performAuthIn(endpoint, username, password) {
	if(com.isBusy() || isLoggedIn()) {
		return;
	}
	com.send(endpoint, {username: username, password:password}, handleAuthInResult);
}

function handleAuthInResult(result) {
	if(result.success) {
		setIdentity(result.sessionToken, result.self);
	}
}

function logout() {
	if(com.isBusy() || !isLoggedIn()) {
		return;
	}		
	com.send("auth/logout", {sessionToken: ""}, handleAuthOutResult);
}

function handleAuthOutResult(result) {
	setIdentity(null, null);
}

function setIdentity(newSessionToken, newSelf) {
	wasLoggedInState = wasLoggedInState || (self != null);

	self = newSelf;
	com.setSessionToken(newSessionToken);
	onIdentityChanged.forEach(function(handler) {
		handler(self);
	});
}

function getSelf() {
	return self;
}

function isLoggedIn() {
	return self != null;
}

function wasLoggedIn() {
	return wasLoggedInState;
}

function addIdentityChangedListener(listener) {
	onIdentityChanged.push(listener);
}
},{"./com":4}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
var dom = module.exports = {
	get: get,
	create: create,
	show: show,
	hide: hide
};

function get(id) {
	return document.getElementById(id);
}

function create(tag, className, textContent) {
	var el = document.createElement(tag);
	if(className) {
		el.className = className;
	}
	if(textContent) {
		el.textContent = textContent;
	}
	return el;
}

function show(id) {
	get(id).style.display = "block";
}

function hide(id) {
	get(id).style.display = "none";
}
},{}],6:[function(require,module,exports){
var langs = {
	de: de(),
	en: en()
};

var loca = module.exports = chooseLang();

function chooseLang() {
	var qsLang = getQueryStringLang();
	if(qsLang != null && localStorage) {
		localStorage.setItem("lang", qsLang);
	}
	var lang = qsLang || getLocalStorageLang() || getNavigatorLang();
	return langs[lang] || langs.en;
}

function getQueryStringLang() {
	var search = (location.search || "?").substring(1);
	var parts = search.split("&");
	for(var i=0; i<parts.length; i++) {
		if(parts[i].substring(0,5) == "lang=") {
			return parts[i].substring(5);
		}
	}
	return null;
}

function getLocalStorageLang() {
	return localStorage && localStorage.getItem("lang");
}

function getNavigatorLang() {
	var lang = navigator.language;
	return lang != null ? lang.substring(0,2) : null;
}

function de() {
	return {
		lang: "de",
	
		login: "Anmelden",
		register: "Registrieren",

		spaceName: "Name des Bereichs",
		username: "Benutzername",
		
		manageSpace: "Bereich verwalten",
		start: "Starten!",
		createSpace: "Bereich anlegen",
		rename: "Umbenennen",
		share: "Freigeben",
		leave: "Verlassen",
		backToIndex: "Zurück zur Übersicht",
		
		noAdmin: "Du bist kein Admin dieses Bereichs. Die Funktionen Umbenennen und Freigeben werden deshalb nicht angeboten.",
		readOnly: "Der Zugriff ist nur lesend.",

		leaveSure: "Bist du sicher, dass du diesen Bereich verlassen willst? Du hast dann keinen Zugriff mehr auf die Daten darin.",
		notFound: "Nicht gefunden",
		
		NONE: "Kein Zugriff",
		READER: "Lesezugriff",
		WRITER: "Lesen und schreiben",
		ADMIN: "Vollzugriff"
	};
}

function en() {
	return {
		lang: "en",
	
		login: "Login",
		register: "Register",

		spaceName: "Space name",
		username: "Username",
		
		manageSpace: "Manage Space",
		start: "Start!",
		createSpace: "Create Space",
		rename: "Rename",
		share: "Share",
		leave: "Leave",
		backToIndex: "Back to Index",
		
		noAdmin: "You are not an admin of this space. The rename and share operations are therefore not provided.",
		readOnly: "The access is read-only.",
		
		leaveSure: "Are you sure that you want to leave this space? The space data will not be available after leaving this space.",
		notFound: "Not found",
		
		NONE: "No access",
		READER: "Read-only access",
		WRITER: "Read and write",
		ADMIN: "Full access"
	};
}
},{}],7:[function(require,module,exports){
var site = "POCZone.net"

var com = require("./com");
var dom = require("./dom");
var loca = require("./loca");

var authManager = require("./authManager");
var spaceManager = require("./spaceManager");
var appStore = require("./appStore");
var appLauncher = require("./appLauncher");

var uiSpaceCreator = require("./uiSpaceCreator");
var uiSpaceEditor = require("./uiSpaceEditor");
var uiSpaceIndex = require("./uiSpaceIndex");
var uiErrorDisplay = require("./uiErrorDisplay");

var main = module.exports = {
	init: init,
	submitAuthForm: submitAuthForm,
	goHome: goHome,
	logout: logout
};

publish(main, window);


function init() {
	uiErrorDisplay.install();

	authManager.addIdentityChangedListener(function() {
		if(authManager.isLoggedIn()) {
			spaceManager.loadSpaces();
		} else {
			location.reload();
		}
		updateDisplay();
	});
	
	spaceManager.addSpacesChangedListener(function() {
		updateDisplay();
	});
	spaceManager.addSpacesChangedListener(uiSpaceIndex.refresh);
	
	com.addBusyChangedListener(function(busy) {
		(busy ? dom.show : dom.hide)("busyOverlay");
	});

	window.addEventListener("hashchange", updateDisplay);
	window.addEventListener("beforeunload", close);
	
	updateDisplay();
}

function submitAuthForm(operation, form) {
	return authManager.submitForm(operation, form);
}

function goHome() {
	location.href = "#";
}

function logout() {
	authManager.logout();
}

function updateDisplay() {
	hideAll();
	setTitle(loca.notFound);
	
	if(authManager.isLoggedIn()) {
		var hash = (location.hash || "#").substring(1);
		
		if(hash == "") {
			showSpaceIndex();
		} else if(hash.substring(0,5) == "edit:") {
			var space = spaceManager.resolveSpace(hash.substring(5));
			if(space != null) {
				showSpaceEditor(space);
			}
		} else if(hash.substring(0,4) == "new:") {
			var app = appStore.getByID(hash.substring(4));
			if(app != null) {
				showAppSpaceCreator(app);
			}
		} else {			
			var space = spaceManager.resolveSpace(hash);
			if(space != null) {
				var app = appStore.getByID(space.app);
				if(app != null) {
					showSpace(space, app);
				}
			}
		}
	} else if(!authManager.wasLoggedIn()) {
		showOutside();
	} else {
		showLogoutInProgress();
	}
}

function hideAll() {
	dom.hide("outside");
	dom.hide("inside");
	dom.hide("inapp");		
	dom.hide("spaceIndex");
	dom.hide("newSpace");
	dom.hide("editSpace");
}

function showSpaceIndex() {
	dom.show("inside");
	dom.show("spaceIndex");
	setTitle(authManager.getSelf().username + " @ " + site);
}

function showSpace(space, app) {
	dom.show("inapp");
	setTitle(space.name);
	appLauncher.launch(space, app);
}

function showAppSpaceCreator(app) {
	dom.show("inside");
	dom.show("newSpace");
	setTitle(app.name + " / " + loca.createSpace);
	
	uiSpaceCreator.show(app);
}

function showSpaceEditor(space) {
	dom.show("inside");
	dom.show("editSpace");
	setTitle(space.name + " / " + loca.manageSpace);
	
	uiSpaceEditor.show(space);
}

function showOutside() {
	setTitle(site);
	dom.show("outside");
}

function showLogoutInProgress() {
	setTitle(site);
}

function setTitle(newTitle) {
	dom.get("title").textContent = newTitle;
	dom.get("title").title = newTitle;
	document.title = newTitle;
}

function close() {
	com.setAsync(false);
	appLauncher.close();
	authManager.logout();
}

function publish(source, target) {
	for(var key in source) {
		target[key] = source[key];
	}
}
},{"./appLauncher":1,"./appStore":2,"./authManager":3,"./com":4,"./dom":5,"./loca":6,"./spaceManager":8,"./uiErrorDisplay":9,"./uiSpaceCreator":10,"./uiSpaceEditor":11,"./uiSpaceIndex":12}],8:[function(require,module,exports){
var com = require("./com");

var spaces = [];
var onSpacesChanged = [];

var spaceManager = module.exports = {
	getSpaces: getSpaces,
	getContributors: getContributors,

	loadSpaces: loadSpaces,
	resolveSpace: resolveSpace,
	getShortSpaceID: getShortSpaceID,
	addSpacesChangedListener: addSpacesChangedListener,
	
	createSpace: createSpace,
	renameSpace: renameSpace,
	shareSpace: shareSpace,
	leaveSpace: leaveSpace
};

function getSpaces() {
	return spaces;
}

function getContributors() {
	var contributors = [];

	spaces.forEach(function(space) {
		space.contributors.forEach(function(c) {
			var username = c.username;
			if(contributors.indexOf(username) < 0) {
				contributors.push(username);
			}
		});
	});

	contributors.sort(function (a, b) {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return contributors;
}

function loadSpaces() {
	com.send("spaces/getMine", {"sessionToken":""}, function(result) {
		if(result.success) {
			spaces = result.spaces;
			onSpacesChanged.forEach(function(listener) {
				listener(spaces);
			});
		}
	});
}

function resolveSpace(shortID) {
	if(shortID) {		
		var matches = spaces.filter(function(space) { return space.spaceUUID.substring(0, shortID.length) == shortID; });
		return matches.length==1 ? matches[0] : null;
	} else {
		return null;
	}
}

function getShortSpaceID(space) {
	var id = space.spaceUUID;
	var maxlen = id.length;
	
	for(var i=2; i<=maxlen; i++) {
		var shortID = id.substring(0, i);
		if(spaces.filter(function(space) { return space.spaceUUID.substring(0,i) == shortID; }).length <= 1) {
			return id.substring(0, Math.min(i+1, maxlen));
		}
	}
	
	return id;
}

function addSpacesChangedListener(listener) {
	onSpacesChanged.push(listener);
}

function createSpace(app, name) {
	com.send("spaces/create", {"sessionToken":"", "spaceName": name, "spaceApp": app.id}, function(result) {
		if(result.success) {
			location.replace("#" + getShortSpaceID(result.space));			
			loadSpaces();
		}
	});
}

function renameSpace(space, newName) {
	com.send("spaces/edit", {"sessionToken":"", "spaceUUID": space.spaceUUID, "spaceName": newName}, function(result) {
		if(result.success) {
			loadSpaces();
		}
	});
}

function shareSpace(space, username, level) {
	com.send("spaces/share", {"sessionToken":"", "spaceUUID": space.spaceUUID, "username": username, "level": level}, function(result) {
		if(result.success) {
			loadSpaces();
		}
	});
}

function leaveSpace(space) {
	com.send("spaces/leave", {"sessionToken":"", "spaceUUID": space.spaceUUID}, function(result) {
		if(result.success) {
			location.replace("#");
			loadSpaces();
		}
	});
}
},{"./com":4}],9:[function(require,module,exports){
var loca = require("./loca");
var com = require("./com");

var uiErrorDisplay = module.exports = {
	install: install
}

function install() {
	com.addAfterCallbackListener(handleResponse);
}

function handleResponse(endpoint, params, result) {
	if(!result.success && result.errors && result.errors.length > 0) {
		var messages = "";

		for(var i=0; i<result.errors.length; i++) {
			var e = result.errors[i];
			var locaMessage = (e.message || {})[loca.lang];
			if(locaMessage) {				
				messages += locaMessage + "\n\n";
			}
		}

		alert(messages.trim());
	}
}
},{"./com":4,"./loca":6}],10:[function(require,module,exports){
var dom = require("./dom");
var loca = require("./loca");
var spaceManager = require("./spaceManager");

var uiSpaceCreator = module.exports = {
	show: show
};
	
function show(app) {
	var parent = dom.get("newSpace");
	parent.innerHTML = "";
	
	parent.appendChild(buildCreateForm(app));
}

function buildCreateForm(app) {
	var nameBox = dom.create("input");
	nameBox.placeholder = loca.spaceName;
	
	var createButton = dom.create("button");
	createButton.innerHTML = "<img src=\"portalres/img/add.png\" /> "+loca.createSpace;
	
	var form = dom.create("form");
	form.onsubmit = function() {
		spaceManager.createSpace(app, nameBox.value);
		return false;
	};
	
	form.appendChild(nameBox);
	form.appendChild(createButton);
	return form;
}

},{"./dom":5,"./loca":6,"./spaceManager":8}],11:[function(require,module,exports){
var dom = require("./dom");
var loca = require("./loca");
var spaceManager = require("./spaceManager");

var uiSpaceEditor = module.exports = {
	show: show
};

function show(space) {
	var parent = dom.get("editSpace");
	parent.innerHTML = "";
	
	parent.appendChild(buildStartForm(space));
	
	if(space.level == "ADMIN") {
		parent.appendChild(buildRenameForm(space));
		parent.appendChild(buildShareForm(space));

		var friendsShareForm = buildFriendsShareForm(space);
		if(friendsShareForm != null) {
			parent.appendChild(friendsShareForm);
		}
	} else {
		parent.appendChild(buildNoAdminHint());
	}
	
	parent.appendChild(buildLeaveForm(space));
	parent.appendChild(buildReturnToIndexForm(space));
}

function buildStartForm(space) {
	var startButton = dom.create("button");
	startButton.innerHTML = "<img src=\"portalres/img/start.png\" /> " + loca.start;
	
	var form = dom.create("form");
	form.onsubmit = function() {
		location.href = "#" + spaceManager.getShortSpaceID(space);
		return false;
	};
	
	form.appendChild(startButton);
	return form;
}

function buildRenameForm(space) {	
	var nameBox = dom.create("input");
	nameBox.placeholder = loca.spaceName;
	nameBox.value = space.name;
	
	var renameButton = dom.create("button");
	renameButton.innerHTML = "<img src=\"portalres/img/rename.png\" /> " + loca.rename;
	
	var form = dom.create("form");
	form.onsubmit = function() {
		var name = nameBox.value;
		spaceManager.renameSpace(space, name);
		return false;
	};
	
	form.appendChild(nameBox);
	form.appendChild(renameButton);
	return form;
}

function buildShareForm(space) {
	var nameBox = dom.create("input");
	nameBox.placeholder = loca.username;

	var levelSelect = buildLevelSelect(true, "WRITER");

	var shareButton = dom.create("button");
	shareButton.innerHTML = "<img src=\"portalres/img/share.png\" /> " + loca.share;

	var form = dom.create("form");
	form.onsubmit = function() {
		var username = nameBox.value;
		var level = levelSelect.options[levelSelect.selectedIndex].value;
		spaceManager.shareSpace(space, username, level);
		return false;
	};
	
	form.appendChild(nameBox);
	form.appendChild(levelSelect);
	form.appendChild(shareButton);
	return form;
}

function buildLevelSelect(long, value) {
	var levelSelect = dom.create("select");
	var levels = ["NONE", "READER", "WRITER", "ADMIN"];
	for(var i=0; i<levels.length; i++) {
		var option = dom.create("option");
		option.text = levels[i] + (long ? " ("+loca[levels[i]]+")" : "");
		option.value = levels[i];
		levelSelect.appendChild(option);
	}
	levelSelect.selectedIndex = levels.indexOf(value);

	return levelSelect;
}

function buildFriendsShareForm(space) {
	var usernames = spaceManager.getContributors();
	if(usernames.length==0) {
		return null;
	}

	var form = dom.create("div", "box align-left");

	usernames.forEach(function(username) {
		var entry = space.contributors.filter(function(entry) { return entry.username == username; })[0];
		var level = entry != null ? entry.level : "NONE";

		var levelSelect = buildLevelSelect(false, level);
		levelSelect.onchange = function() {
			var newLevel = levelSelect.options[levelSelect.selectedIndex].value;
			spaceManager.shareSpace(space, username, newLevel);
		};
		
		var div = dom.create("div", "userlevel userlevel-"+level);
		div.appendChild(levelSelect);
		div.appendChild(dom.create("span", null, username));

		form.appendChild(div);
	});

	return form;
}

function buildLeaveForm(space) {	
	var leaveButton = dom.create("button");
	leaveButton.innerHTML = "<img src=\"portalres/img/leave.png\" /> " + loca.leave;
	
	var form = dom.create("form");
	form.onsubmit = function() {
		if(confirm(loca.leaveSure)) {
			spaceManager.leaveSpace(space);
		}
		return false;
	};
	
	form.appendChild(leaveButton);
	return form;
}

function buildReturnToIndexForm(space) {
	var returnButton = dom.create("button");
	returnButton.innerHTML = "<img src=\"portalres/img/home.png\" /> " + loca.backToIndex;
	
	var form = dom.create("form");
	form.onsubmit = function() {
		location.href = "#";
		return false;
	};
	form.appendChild(returnButton);
	return form;
}

function buildNoAdminHint() {
	return dom.create("div", "box", loca.noAdmin);
}
},{"./dom":5,"./loca":6,"./spaceManager":8}],12:[function(require,module,exports){
var dom = require("./dom");
var loca = require("./loca");
var appStore = require("./appStore");
var spaceManager = require("./spaceManager");

var uiSpaceIndex = module.exports = {
	refresh: refresh
};

function refresh(spaces) {
	var spacesEl = dom.get("spaceIndex");	
	spacesEl.innerHTML = "";
	
	appStore.getAll().forEach(function(app) {
		var appSpaces = spaces.filter(function(space) { return space.app==app.id; });
		
		var appEl = dom.create("div", "app");
		
		appEl.appendChild(dom.create("div", "appHead", app.name));
		appEl.appendChild(dom.create("div", "appInfo", app.info));

		appSpaces.forEach(function(space) {
			var shortID = spaceManager.getShortSpaceID(space);
			appEl.appendChild(buildAppSpaceWidget(app, space, shortID));
		});
		
		appEl.appendChild(buildAddButton(app));
		
		spacesEl.appendChild(appEl);
	});
}

function buildAppSpaceWidget(app, space, shortID) {
	var div = dom.create("div", "appSpace");
	div.appendChild(buildEditButton(shortID));
	div.appendChild(buildLink(space, shortID));	
	if(space.level == "READER") {
		div.appendChild(buildReadOnly());
	}
	if(space.contributors.length > 0) {
		div.appendChild(buildContributorsSpan(space));
	}
	
	return div;
}

function buildLink(space, shortID) {
	var a = dom.create("a", null, space.name);
	a.href = "#" + shortID;
	return a;
}

function buildEditButton(shortID) {
	var editBtn = dom.create("button");
	editBtn.innerHTML = "<img src=\"portalres/img/settings.png\" />";
	editBtn.title = loca.manageSpace;
	editBtn.onclick = function() {
		location.href = "#edit:" + shortID;
	};
	return editBtn;
}

function buildReadOnly() {
	var span = dom.create("span", "spaceInfo");
	span.innerHTML = "<img src=\"portalres/img/readOnly.png\">";
	span.title = loca.readOnly;
	return span;
}

function buildContributorsSpan(space) {
	var span = dom.create("span", "spaceInfo");
	span.innerHTML = "<img src=\"portalres/img/contributors.png\">"+space.contributors.length;
	span.title = space.contributors.map(function(c) { return c.username+" ("+c.level+")" }).join(", ");
	return span;
}

function buildAddButton(app) {
	var addBtn = dom.create("button");
	addBtn.innerHTML = "<img src=\"portalres/img/add.png\" />";
	addBtn.title = loca.createSpace;
	addBtn.onclick = function() {
		location.href = "#new:" + app.id;
	};
	return addBtn;
}
},{"./appStore":2,"./dom":5,"./loca":6,"./spaceManager":8}]},{},[7]);
