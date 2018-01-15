var com = require("./com");

var spaces = [];
var onSpacesChanged = [];

var spaceManager = module.exports = {
	getSpaces: getSpaces,
	getContributors: getContributors,

	loadSpaces: loadSpaces,
	resolveSpace: resolveSpace,
	getShortSpaceID: getShortSpaceID,
	addSpacesChangedListener: addSpacesChangedListener,
	
	createSpace: createSpace,
	renameSpace: renameSpace,
	shareSpace: shareSpace,
	leaveSpace: leaveSpace,
	collectCoupon: collectCoupon
};

function getSpaces() {
	return spaces;
}

function getContributors() {
	var contributors = [];

	spaces.forEach(function(space) {
		space.contributors.forEach(function(c) {
			var username = c.username;
			if(contributors.indexOf(username) < 0) {
				contributors.push(username);
			}
		});
	});

	contributors.sort(function (a, b) {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return contributors;
}

function loadSpaces() {
	com.send("spaces/getMine", {"sessionToken":""}, function(result) {
		if(result.success) {
			spaces = result.spaces;
			onSpacesChanged.forEach(function(listener) {
				listener(spaces);
			});
		}
	});
}

function resolveSpace(shortID) {
	if(shortID) {		
		var matches = spaces.filter(function(space) { return space.spaceUUID.substring(0, shortID.length) == shortID; });
		return matches.length==1 ? matches[0] : null;
	} else {
		return null;
	}
}

function getShortSpaceID(space) {
	var id = space.spaceUUID;
	var maxlen = id.length;
	
	for(var i=2; i<=maxlen; i++) {
		var shortID = id.substring(0, i);
		if(spaces.filter(function(space) { return space.spaceUUID.substring(0,i) == shortID; }).length <= 1) {
			return id.substring(0, Math.min(i+1, maxlen));
		}
	}
	
	return id;
}

function addSpacesChangedListener(listener) {
	onSpacesChanged.push(listener);
}

function createSpace(app, name) {
	com.send("spaces/create", {"sessionToken":"", "spaceName": name, "spaceApp": app.id}, function(result) {
		if(result.success) {
			location.replace("#" + getShortSpaceID(result.space));			
			loadSpaces();
		}
	});
}

function renameSpace(space, newName) {
	com.send("spaces/edit", {"sessionToken":"", "spaceUUID": space.spaceUUID, "spaceName": newName}, function(result) {
		if(result.success) {
			loadSpaces();
		}
	});
}

function shareSpace(space, username, level) {
	com.send("spaces/share", {"sessionToken":"", "spaceUUID": space.spaceUUID, "username": username, "level": level}, function(result) {
		if(result.success) {
			loadSpaces();
		}
	});
}

function leaveSpace(space) {
	com.send("spaces/leave", {"sessionToken":"", "spaceUUID": space.spaceUUID}, function(result) {
		if(result.success) {
			location.replace("#");
			loadSpaces();
		}
	});
}

function collectCoupon(coupon) {
	com.send("spaces/coupons/collect", {"sessionToken":"", "coupon": coupon}, function(result) {
		if(result.success) {
			loadSpaces();
		}
		location.replace("#");
	});
}