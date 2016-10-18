'use strict';

class Event {
	constructor(timestamp = Date.now()) {
		this.timestamp = timestamp;
	}
}

module.exports = Event;
