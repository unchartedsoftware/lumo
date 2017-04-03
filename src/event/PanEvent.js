'use strict';

const Event = require('./Event');

class PanEvent extends Event {
	constructor(plot, prevPos = plot.viewport.getPosition(), currentPos = plot.viewport.getPosition()) {
		super();
		this.plot = plot;
		this.prevPos = prevPos;
		this.currentPos = currentPos;
	}
}

module.exports = PanEvent;
