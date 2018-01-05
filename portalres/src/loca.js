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