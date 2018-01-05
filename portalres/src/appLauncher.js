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