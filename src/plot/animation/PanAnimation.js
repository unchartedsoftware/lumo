'use strict';

const EventType = require('../../event/EventType');
const PanEvent = require('../../event/PanEvent');

/**
 * Class representing a pan animation.
 */
class PanAnimation {

	/**
	 * Instantiates a new PanAnimation object.
	 *
	 * @param {Object} params - The parameters of the animation.
	 * @param {Number} params.plot - The plot target of the animation.
	 * @param {Number} params.start - The start timestamp of the animation.
	 * @param {Number} params.delta - The positional delta of the animation.
	 * @param {Number} params.easing - The easing factor of the animation.
	 * @param {Number} params.duration - The duration of the animation.
	 */
	constructor(params = {}) {
		this.timestamp = Date.now();
		this.plot = params.plot;
		this.start = params.start;
		this.delta = params.delta;
		this.end = {
			x: this.start.x + this.delta.x,
			y: this.start.y + this.delta.y,
		};
		this.easing = params.easing;
		this.duration = params.duration;
	}

	/**
	 * Updates the position of the plot based on the current state of the
	 * animation.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 */
	update(timestamp) {
		const t = Math.min(1.0, (timestamp - this.timestamp) / (this.duration || 1));
		// calculate the progress of the animation
		const progress = 1 - Math.pow(1 - t, 1 / this.easing);
		// caclulate the current position along the pan
		const plot = this.plot;
		const prev = plot.viewport.getPosition();
		const current = {
			x: this.start.x + this.delta.x * progress,
			y: this.start.y + this.delta.y * progress
		};
		// set the viewport positions
		plot.viewport.x = current.x;
		plot.viewport.y = current.y;
		// create pan event
		const event = new PanEvent(plot, prev, current);
		// check if animation is finished
		if (t < 1) {
			plot.emit(EventType.PAN, event);
		} else {
			plot.emit(EventType.PAN_END, event);
			// remove self from plot
			plot.panAnimation = null;
		}
	}

	/**
	 * Cancels the current animation and removes it from the plot.
	 */
	cancel() {
		const plot = this.plot;
		const current = plot.viewport.getPosition();
		// emit pan end
		plot.emit(EventType.PAN_END, new PanEvent(plot, current, this.end));
		// remove self from plot
		plot.panAnimation = null;
	}

	/**
	 * Complete the current animation and remove it from the plot.
	 */
	finish() {
		const plot = this.plot;
		const current = plot.viewport.getPosition();
		// set the viewport positions
		plot.viewport.x = this.end.x;
		plot.viewport.y = this.end.y;
		// emit pan end
		const event = new PanEvent(plot, current, this.end);
		plot.emit(EventType.PAN_END, event);
		// remove self from plot
		plot.panAnimation = null;
	}
}

module.exports = PanAnimation;
