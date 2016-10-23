'use strict';

const defaultTo = require('lodash/defaultTo');
const PanAnimation = require('../animation/PanAnimation');
const EventType = require('../../event/EventType');
const PanEvent = require('../../event/PanEvent');
const Request = require('./../Request');

// Constants

/**
 * Time in milliseconds before a pan point expires.
 * @constant {Number}
 */
const PAN_EXPIRY_MS = 50;

/**
 * Pan inertia enabled.
 * @constant {boolean}
 */
const PAN_INTERTIA = true;

/**
 * Pan inertia easing.
 * @constant {Number}
 */
const PAN_INTERTIA_EASING = 0.2;

/**
 * Pan inertia deceleration.
 * @constant {Number}
 */
const PAN_INTERTIA_DECELERATION = 3400;

// Private Methods

const pan = function(plot, delta) {
	if (plot.zoomAnimation) {
		// no panning while zooming
		return;
	}
	const prev = {
		x: plot.viewport.x,
		y: plot.viewport.y
	};
	const current = {
		x: prev.x -= delta.x,
		y: prev.y -= delta.y
	};
	// update current viewport
	plot.viewport.x = current.x;
	plot.viewport.y = current.y;
	// request tiles
	Request.panRequest(plot);
	// emit pan
	plot.emit(EventType.PAN, new PanEvent(plot, prev, current));
};

const isRightButton = function(event) {
	return (event.which) ? event.which === 3 : event.button === 2;
};

/**
 * Class representing a pan handler.
 */
class PanHandler {

	/**
	 * Instantiates a new PanHandler object.
	 *
	 * @param {Plot} plot - The plot to attach the handler to.
	 * @param {Object} options - The parameters of the animation.
	 * @param {Number} options.inertia - Whether or not pan inertia is enabled.
	 * @param {Number} options.inertiaEasing - The inertia easing factor.
	 * @param {Number} options.inertiaDeceleration - The inertia deceleration factor.
	 */
	constructor(plot, options = {}) {
		this.inertia = defaultTo(options.inertia, PAN_INTERTIA);
		this.inertiaEasing = defaultTo(options.inertiaEasing, PAN_INTERTIA_EASING);
		this.inertiaDeceleration = defaultTo(options.inertiaDeceleration, PAN_INTERTIA_DECELERATION);
		this.plot = plot;
		this.enabled = false;
	}

	/**
	 * Enables the handler.
	 *
	 * @returns {PanHandler} The handler object, for chaining.
	 */
	enable() {
		if (this.enabled) {
			throw 'Handler is already enabled';
		}

		const plot = this.plot;

		let down = false;
		let lastPos = null;
		let lastTime = null;
		let positions = [];
		let times = [];

		this.mousedown = (event) => {
			// ignore if right-button
			if (isRightButton(event)) {
				return;
			}
			// flag as down
			down = true;
			// set position and timestamp
			lastPos = plot.mouseToViewPx(event);
			lastTime = Date.now();
			if (this.inertia) {
				// clear existing pan animation
				plot.panAnimation = null;
				// reset position and time arrays
				positions = [];
				times = [];
			}
		};

		this.mousemove = (event) => {
			if (down) {
				// get latest position and timestamp
				let pos = plot.mouseToViewPx(event);
				let time = Date.now();

				if (positions.length === 0) {
					// emit pan start
					const prev = { x: lastPos.x, y: lastPos.y };
					const current = { x: pos.x, y: pos.y };
					plot.emit(EventType.PAN_START, new PanEvent(plot, prev, current));
				}

				if (this.inertia) {
					// add to position and time arrays
					positions.push(pos);
					times.push(time);
					// prevent array from getting too big
					if (time - times[0] > PAN_EXPIRY_MS) {
						positions.shift();
						times.shift();
					}
				}

				// calculate the positional delta
				const delta = {
					x: pos.x - lastPos.x,
					y: pos.y - lastPos.y
				};
				// pan the plot
				pan(plot, delta);
				// update last position and time
				lastTime = time;
				lastPos = pos;
			}
		};

		this.mouseup = (event) => {

			// flag as up
			down = false;

			// ignore if right-button
			if (isRightButton(event)) {
				return;
			}

			if (!this.inertia || positions.length === 0) {
				// exit early if no inertia or no movement
				const prev = { x: plot.viewport.x, y: plot.viewport.y };
				const current = { x: plot.viewport.x, y: plot.viewport.y };
				plot.emit(EventType.PAN_END, new PanEvent(plot, prev, current));
				return;
			}

			// get timestamp
			const time = Date.now();

			// strip any positions that are too old
			while (time - times[0] > PAN_EXPIRY_MS) {
				positions.shift();
				times.shift();
			}

			if (times.length < 2) {
				// exit early if no remaining positions
				const prev = { x: plot.viewport.x, y: plot.viewport.y };
				const current = { x: plot.viewport.x, y: plot.viewport.y };
				plot.emit(EventType.PAN_END, new PanEvent(plot, prev, current));
				return;
			}

			// shorthand
			const deceleration = this.inertiaDeceleration;
			const easing = this.inertiaEasing;

			// calculate direction from earliest to latest
			const direction = {
				x: lastPos.x - positions[0].x,
				y: lastPos.y - positions[0].y
			};
			// calculate the time difference
			const diff = (lastTime - times[0]) / 1000;
			// calculate velocity
			const velocity = {
				x: direction.x * (easing / diff),
				y: direction.y * (easing / diff)
			};
			// calculate speed
			const speed = Math.sqrt(
				(velocity.x * velocity.x) +
				(velocity.y * velocity.y));
			// calculate panning duration
			const duration = speed / (deceleration * easing);
			// calculate inertia delta
			const delta = {
				x: Math.round(velocity.x * (-duration / 2)),
				y: Math.round(velocity.y * (-duration / 2))
			};
			// get current viewport x / y
			const start = {
				x: plot.viewport.x,
				y: plot.viewport.y
			};
			// set pan animation
			plot.panAnimation = new PanAnimation({
				start: start,
				delta: delta,
				easing: easing,
				duration: duration * 1000 // back to ms
			});
		};

		this.plot.container.addEventListener('mousedown', this.mousedown);
		document.addEventListener('mousemove', this.mousemove);
		document.addEventListener('mouseup', this.mouseup);
		this.enabled = true;
	}

	/**
	 * Disables the handler.
	 *
	 * @returns {PanHandler} The handler object, for chaining.
	 */
	disable() {
		if (!this.enabled) {
			throw 'Handler is already disabled';
		}
		this.plot.container.removeEventListener('mousedown', this.mousedown);
		document.removeEventListener('mousemove', this.mousemove);
		document.removeEventListener('mouseup', this.mouseup);
		this.mousedown = null;
		this.mousemove = null;
		this.mouseup = null;
		this.enabled = false;
	}
}

module.exports = PanHandler;
