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