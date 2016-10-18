'use strict';

const Event = require('./Event');

class FrameEvent extends Event {
	constructor(timestamp) {
		super(timestamp);
	}
}

module.exports = FrameEvent;
