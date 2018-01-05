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
