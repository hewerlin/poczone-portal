var dom = module.exports = {
	get: get,
	create: create,
	show: show,
	hide: hide
};

function get(id) {
	return document.getElementById(id);
}

function create(tag, className, textContent) {
	var el = document.createElement(tag);
	if(className) {
		el.className = className;
	}
	if(textContent) {
		el.textContent = textContent;
	}
	return el;
}

function show(id) {
	get(id).style.display = "block";
}

function hide(id) {
	get(id).style.display = "none";
}