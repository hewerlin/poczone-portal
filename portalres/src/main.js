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
		}  else if(hash.substring(0,7) == "coupon:") {
			var coupon = hash.split(":")[1];
			spaceManager.collectCoupon(coupon);
			showSpaceIndex();
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