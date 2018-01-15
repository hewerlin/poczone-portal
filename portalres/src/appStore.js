var noop = "apps/noop/index.htm";
var nyiHint = " (NYI)";

var apps = [
	{
		id: "KANBAN",
		name: "Kanban Bubbles",
		info: "Simple Kanban Board to keep an overview",
		baseURL: "https://poczone.net/apps/kanban-bubbles/"
	}
	,{
		id: "GF",
		name: "Gedanken-Fetzen",
		info: "Undirected graph of text nodes, useful for quotes",
		baseURL: "https://poczone.net/apps/gedanken-fetzen/"
	}
	,{
		id: "CON",
		name: "Concepts",
		info: "Nested lists (WORK IN PROGRESS!)",
		baseURL: "https://poczone.net/apps/concepts/"
	}
	,{
		id: "DEMO",
		name: "API Demo",
		info: "Demo for the POCZone.net API concept",
		baseURL: noop
	}
];

var appStore = module.exports = {
	getAll: function() {
		return apps;
	},
	getByID: function(appID) {
		return apps.filter(function(app) { return app.id==appID; })[0];
	}
};