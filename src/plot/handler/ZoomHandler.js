'use strict';

const clamp = require('lodash/clamp');
const defaultTo = require('lodash/defaultTo');
const Browser = require('../../core/Browser');
const EventType = require('../../event/EventType');
const ZoomEvent = require('../../event/ZoomEvent');
const ZoomAnimation = require('../animation/ZoomAnimation');
const Request = require('../Request');
const Viewport = require('../Viewport');

// Constants

/**
 * Amount of scroll pixels per zoom level.
 * @private
 * @constant {Number}
 */
const ZOOM_WHEEL_DELTA = 300;

/**
 * Length of zoom animation in milliseconds.
 * @private
 * @constant {Number}
 */
const ZOOM_ANIMATION_MS = 250;

/**
 * Maximum concurrent discrete zooms in a single batch.
 * @private
 * @constant {Number}
 */
const MAX_CONCURRENT_ZOOMS = 4;

/**
 * Zoom debounce delay in miliseconds.
 * @private
 * @constant {Number}
 */
const ZOOM_DEBOUNCE_MS = 100;

/**
 * Continuous zoom enabled.
 * @private
 * @constant {boolean}
 */
const CONTINUOUS_ZOOM = false;

// Private Methods

let last = Date.now();
const skipInterpolation = function(animation, delta) {
	// NOTE: attempt to determine if the scroll device is a mouse or a
	// trackpad. Mouse scrolling creates large infrequent deltas while
	// trackpads create tons of very small deltas. We want to interpolate
	// between wheel events, but not between trackpad events.
	const now = Date.now();
	const tdelta = now - last;
	last = now;
	if (delta % 4.000244140625 === 0) {
		// definitely a wheel, interpolate
		return false;
	}
	if (Math.abs(delta) < 4) {
		// definitely track pad, do not interpolate
		return true;
	}
	if (animation && animation.duration !== 0) {
		// current animation has interpolation, should probably interpolate
		// the next animation too.
		// NOTE: without this, rapid wheel scrolling will trigger the skip
		// below
		return false;
	}
	if (tdelta < 40) {
		// events are close enough together that we should probably
		// not interpolate
		return true;
	}
	return false;
};

const computeZoomDelta = function(wheelDelta, continuousZoom, deltaPerZoom, maxZooms) {
	let zoomDelta = wheelDelta / deltaPerZoom;
	if (!continuousZoom) {
		// snap value if not continuous zoom
		if (wheelDelta > 0) {
			zoomDelta = Math.ceil(zoomDelta);
		} else {
			zoomDelta = Math.floor(zoomDelta);
		}
	}
	// clamp zoom delta to max concurrent zooms
	return clamp(zoomDelta, -maxZooms, maxZooms);
};

const computeTargetZoom = function(zoomDelta, currentZoom, currentAnimation, minZoom, maxZoom) {
	let targetZoom;
	if (currentAnimation) {
		// append to existing animation target
		targetZoom = currentAnimation.targetZoom + zoomDelta;
	} else {
		targetZoom = currentZoom + zoomDelta;
	}
	// clamp the target zoom to min and max zoom level of plot
	return clamp(targetZoom, minZoom, maxZoom);
};

const zoom = function(plot, targetPx, zoomDelta, duration) {
	// calculate target zoom level
	const targetZoom = computeTargetZoom(
		zoomDelta,
		plot.zoom,
		plot.zoomAnimation,
		plot.minZoom,
		plot.maxZoom);
	// check if we need to zoom
	if (targetZoom !== plot.zoom) {
		// set target viewport
		const targetViewport = plot.viewport.zoomFromPlotPx(
			plot.tileSize,
			plot.zoom,
			targetZoom,
			targetPx);
		// clear pan animation
		plot.panAnimation = null;
		// set zoom animation
		plot.zoomAnimation = new ZoomAnimation({
			duration: duration,
			prevZoom: plot.zoom,
			targetZoom: targetZoom,
			prevViewport: new Viewport(plot.viewport),
			targetViewport: targetViewport,
			targetPx: targetPx
		});
		// request tiles
		Request.zoomRequest(plot, targetViewport, targetZoom);
		// emit zoom start
		plot.emit(EventType.ZOOM_START, new ZoomEvent(plot, plot.zoom, plot.zoom, targetZoom));
	}
};

const zoomFromWheel = function(handler, plot, targetPx, wheelDelta, continuousZoom) {
	// no wheel delta, exit early
	if (wheelDelta === 0) {
		return;
	}
	// calculate zoom delta from wheel delta
	const zoomDelta = computeZoomDelta(
		wheelDelta,
		continuousZoom,
		handler.deltaPerZoom,
		handler.maxConcurrentZooms);
	// get duration
	let duration = handler.zoomDuration;
	if (continuousZoom && skipInterpolation(plot.zoomAnimation, wheelDelta)) {
		// skip animation interpolation
		duration = 0;
	}
	// process the zoom
	zoom(plot, targetPx, zoomDelta, duration);
};

const getWheelDelta = function(plot, event) {
	if (event.deltaMode === 0) {
		// pixels
		if (Browser.firefox) {
			return -event.deltaY / plot.pixelRatio;
		}
		return -event.deltaY;
	} else if (event.deltaMode === 1) {
		// lines
		return -event.deltaY * 20;
	}
	// pages
	return -event.deltaY * 60;
};

/**
 * Class representing a zoom handler.
 */
class ZoomHandler {

	/**
	 * Instantiates a new ZoomHandler object.
	 *
	 * @param {Plot} plot - The plot to attach the handler to.
	 * @param {Object} options - The parameters of the animation.
	 * @param {Number} options.continuousZoom - Whether or not continuous zoom is enabled.
	 * @param {Number} options.zoomDuration - The duration of the zoom animation.
	 * @param {Number} options.maxConcurrentZooms - The maximum concurrent zooms in a single batch.
	 * @param {Number} options.deltaPerZoom - The scroll delta required per zoom level.
	 * @param {Number} options.zoomDebounce - The debounce duration of the zoom in ms.
	 */
	constructor(plot, options = {}) {
		this.continuousZoom = defaultTo(options.continuousZoom, CONTINUOUS_ZOOM);
		this.zoomDuration = defaultTo(options.zoomDuration, ZOOM_ANIMATION_MS);
		this.maxConcurrentZooms = defaultTo(options.maxConcurrentZooms, MAX_CONCURRENT_ZOOMS);
		this.deltaPerZoom = defaultTo(options.deltaPerZoom, ZOOM_WHEEL_DELTA);
		this.zoomDebounce = defaultTo(options.zoomDebounce, ZOOM_DEBOUNCE_MS);
		this.plot = plot;
		this.enabled = false;
	}

	/**
	 * Enables the handler.
	 *
	 * @returns {ZoomHandler} The handler object, for chaining.
	 */
	enable() {
		if (this.enabled) {
			throw 'Handler is already enabled';
		}

		const plot = this.plot;

		let wheelDelta = 0;
		let timeout = null;
		let evt = null;

		this.dblclick = (event) => {
			// get mouse position
			const targetPx = plot.mouseToPlotPx(event);
			// zoom the plot by one level
			zoom(plot, targetPx, 1, this.zoomDuration);
		};

		this.wheel = (event) => {

			// get normalized delta
			const delta = getWheelDelta(plot, event);

			if (!this.continuousZoom && Math.abs(delta) < 4) {
				// mitigate the hyper sensitivty of a trackpad
				return;
			}

			// increment wheel delta
			wheelDelta += delta;

			// check zoom type
			if (this.continuousZoom) {
				// get target pixel from mouse position
				const targetPx = plot.mouseToPlotPx(event);
				// process continuous zoom immediately
				zoomFromWheel(this, plot, targetPx, wheelDelta, true);
				// reset wheel delta
				wheelDelta = 0;
			} else {
				// set event
				evt = event;
				// debounce discrete zoom
				if (!timeout) {
					timeout = setTimeout(() => {
						// get target pixel from mouse position
						// NOTE: this is called inside the closure to ensure
						// that we use the current viewport of the plot to
						// convert from mouse to plot pixels
						const targetPx = plot.mouseToPlotPx(evt);
						// process zoom event
						zoomFromWheel(this, plot, targetPx, wheelDelta, false);
						// reset wheel delta
						wheelDelta = 0;
						// clear timeout
						timeout = null;
						// clear event
						evt = null;
					}, this.zoomDebounce);
				}
			}
			// prevent default behavior and stop propagationa
			event.preventDefault();
			event.stopPropagation();
		};

		this.plot.container.addEventListener('dblclick', this.dblclick);
		this.plot.container.addEventListener('wheel', this.wheel);
		this.enabled = true;
	}

	/**
	 * Disables the handler.
	 *
	 * @returns {ZoomHandler} The handler object, for chaining.
	 */
	disable() {
		if (this.enabled) {
			throw 'Handler is already disabled';
		}
		this.plot.container.removeEventListener('dblclick', this.dblclick);
		this.plot.container.removeEventListener('wheel', this.wheel);
		this.dblclick = null;
		this.wheel = null;
		this.enabled = false;
	}

	/**
	 * Zooms in to the target zoom level. This is bounded by the plot objects
	 * minZoom and maxZoom attributes.
	 *
	 * @param {Number} level - The target zoom level.
	 * @param {Object} plotPx - the target pixel to center the zoom around.
	 * @param {boolean} animate - Whether or not to animate the zoom. Defaults to `true`.
	 */
	zoomTo(level, plotPx, animate = true) {
		const plot = this.plot;
		//const targetPx = plot.viewport.getCenter();
		const zoomDelta = level - plot.zoom;
		if (!animate) {
			// do not animate
			zoom(plot, plotPx, zoomDelta, 0);
		} else {
			// animate
			zoom(plot, plotPx, zoomDelta, this.zoomDuration);
		}
	}
}

module.exports = ZoomHandler;
