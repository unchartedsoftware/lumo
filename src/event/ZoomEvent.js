'use strict';

const Event = require('./Event');

class ZoomEvent extends Event {
	constructor(plot, prevZoom, currentZoom, targetZoom) {
		super();
		this.plot = plot;
		this.prevZoom = prevZoom;
		this.currentZoom = currentZoom;
		this.targetZoom = targetZoom;
	}
}

module.exports = ZoomEvent;
