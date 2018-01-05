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