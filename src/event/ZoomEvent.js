'use strict';

const Event = require('./Event');

/**
 * Class representing a zoom event.
 */
class ZoomEvent extends Event {

	/**
	 * Instantiates a new ZoomEvent object.
	 *
	 * @param {Number} plot - The plot object.
	 * @param {Number} prevZoom - The previous zoom.
	 * @param {Number} currentZoom - The current zoom.
	 * @param {Number} targetZoom - The target zoom.
	 */
	constructor(plot, prevZoom, currentZoom, targetZoom) {
		super();
		this.plot = plot;
		this.prevZoom = prevZoom;
		this.currentZoom = currentZoom;
		this.targetZoom = targetZoom;
	}
}

module.exports = ZoomEvent;
