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