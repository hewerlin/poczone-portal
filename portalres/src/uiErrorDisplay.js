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