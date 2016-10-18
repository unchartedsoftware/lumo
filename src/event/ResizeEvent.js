'use strict';

const Event = require('./Event');

class ResizeEvent extends Event {
	constructor(plot, prevSize, targetSize) {
		super();
		this.plot = plot;
		this.prevSize = prevSize;
		this.targetSize = targetSize;
	}
}

module.exports = ResizeEvent;
