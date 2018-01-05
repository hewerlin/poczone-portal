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