'use strict';

const EventType = require('../../event/EventType');
const ZoomEvent = require('../../event/ZoomEvent');

/**
 * Class representing a zoom animation.
 */
class ZoomAnimation {

	/**
	 * Instantiates a new ZoomAnimation object.
	 *
	 * @param {Object} params - The parameters of the animation.
	 * @param {Number} params.plot - The plot target of the animation.
	 * @param {Number} params.prevZoom - The starting zoom of the animation.
	 * @param {Number} params.targetZoom - The target zoom of the animation.
	 * @param {Number} params.prevViewport - The starting viewport of the animation.
	 * @param {Number} params.targetViewport - The target viewport of the animation.
	 * @param {Number} params.targetPx - The target pixel of the animation, in plot coordinates.
	 * @param {Number} params.duration - The duration of the animation.
	 */
	constructor(params = {}) {
		this.timestamp = Date.now();
		this.plot = params.plot;
		this.duration = params.duration;
		this.prevZoom = params.prevZoom;
		this.targetZoom = params.targetZoom;
		this.prevViewport = params.prevViewport;
		this.targetViewport = params.targetViewport;
		this.targetPx = params.targetPx;
	}

	/**
	 * Updates the zoom of the plot based on the current state of the
	 * animation.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 */
	update(timestamp) {
		// get t value
		const t = Math.min(1.0, (timestamp - this.timestamp) / (this.duration || 1));
		// calc new zoom
		const range = this.targetZoom - this.prevZoom;
		const zoom = this.prevZoom + (range * t);
		const plot = this.plot;
		// set new zoom
		plot.zoom = zoom;
		// calc new viewport position from prev
		plot.viewport = this.prevViewport.zoomFromPlotPx(
			plot.tileSize,
			this.prevZoom,
			plot.zoom,
			this.targetPx);
		// create zoom event
		const event = new ZoomEvent(plot, this.prevZoom, plot.zoom, this.targetZoom);
		// check if animation is finished
		if (t < 1) {
			plot.emit(EventType.ZOOM, event);
		} else {
			plot.emit(EventType.ZOOM_END, event);
			// remove self from plot
			plot.zoomAnimation = null;
		}
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
			plot.viewport = this.prevViewport.zoomFromPlotPx(
				plot.tileSize,
				this.prevZoom,
				plot.zoom,
				this.targetPx);
		}
		// emit zoom end
		const event = new ZoomEvent(plot, this.prevZoom, plot.zoom, this.targetZoom);
		plot.emit(EventType.ZOOM_END, event);
		// remove self from plot
		plot.zoomAnimation = null;
	}

	/**
	 * Complete the current animation and remove it from the plot.
	 */
	finish() {
		const plot = this.plot;
		plot.zoom = this.targetZoom;
		plot.viewport = this.targetViewport;
		// emit zoom end
		const event = new ZoomEvent(plot, this.prevZoom, plot.zoom, this.targetZoom);
		plot.emit(EventType.ZOOM_END, event);
		// remove self from plot
		plot.zoomAnimation = null;
	}
}

module.exports = ZoomAnimation;
