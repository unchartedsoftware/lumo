'use strict';

const EventType = require('../../event/EventType');
const Event = require('../../event/Event');
const Animation = require('./Animation');

/**
 * Class representing a zoom animation.
 */
class ZoomAnimation extends Animation {

	/**
	 * Instantiates a new ZoomAnimation object.
	 *
	 * @param {Object} params - The parameters of the animation.
	 * @param {number} params.plot - The plot target of the animation.
	 * @param {number} params.duration - The duration of the animation.
	 * @param {number} params.prevZoom - The starting zoom of the animation.
	 * @param {number} params.targetZoom - The target zoom of the animation.
	 * @param {number} params.prevViewport - The starting viewport of the animation.
	 * @param {number} params.targetViewport - The target viewport of the animation.
	 * @param {number} params.targetPos - The target position of the animation, in plot coordinates.
	 */
	constructor(params = {}) {
		super(params);
		this.prevZoom = params.prevZoom;
		this.targetZoom = params.targetZoom;
		this.prevViewport = params.prevViewport;
		this.targetViewport = params.targetViewport;
		this.targetPos = params.targetPos;
	}

	/**
	 * Updates the zoom of the plot based on the current state of the
	 * animation.
	 *
	 * @param {number} timestamp - The frame timestamp.
	 *
	 * @returns {boolean} Whether or not the animation has finished.
	 */
	update(timestamp) {
		const t = this.getT(timestamp);
		// calc new zoom
		const range = this.targetZoom - this.prevZoom;
		const zoom = this.prevZoom + (range * t);
		const plot = this.plot;
		// set new zoom
		plot.zoom = zoom;
		// calc new viewport position from prev
		plot.viewport = this.prevViewport.zoomToPos(
			this.prevZoom,
			plot.zoom,
			this.targetPos);
		// create zoom event
		const event = new Event(plot);
		// check if animation is finished
		if (t < 1) {
			plot.emit(EventType.ZOOM, event);
			return false;
		}
		plot.emit(EventType.ZOOM_END, event);
		return true;
	}

	/**
	 * Cancels the current animation and removes it from the plot.
	 */
	cancel() {
		const plot = this.plot;
		if (!plot.continuousZoom) {
			// round to the closest zoom
			plot.zoom = Math.round(plot.zoom);
			// calc viewport position from prev
			plot.viewport = this.prevViewport.zoomToPos(
				this.prevZoom,
				plot.zoom,
				this.targetPos);
		}
		// emit zoom end
		const event = new Event(plot);
		plot.emit(EventType.ZOOM_END, event);
	}

	/**
	 * Complete the current animation and remove it from the plot.
	 */
	finish() {
		const plot = this.plot;
		plot.zoom = this.targetZoom;
		plot.viewport = this.targetViewport;
		// emit zoom end
		const event = new Event(plot);
		plot.emit(EventType.ZOOM_END, event);
	}
}

module.exports = ZoomAnimation;
