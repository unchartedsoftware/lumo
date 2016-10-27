'use strict';

const Event = require('./Event');

class PanEvent extends Event {
	constructor(plot, prevPx = plot.viewport.getPosition(), currentPx = plot.viewport.getPosition()) {
		super();
		this.plot = plot;
		this.prevPx = prevPx;
		this.currentPx = currentPx;
	}
}

module.exports = PanEvent;
