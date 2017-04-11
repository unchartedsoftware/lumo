'use strict';

const EventType = require('../../event/EventType');
const Event = require('../../event/Event');
const Animation = require('./Animation');

/**
 * Class representing a pan animation.
 */
class PanAnimation extends Animation {

	/**
	 * Instantiates a new PanAnimation object.
	 *
	 * @param {Object} params - The parameters of the animation.
	 * @param {Number} params.plot - The plot target of the animation.
	 * @param {Number} params.duration - The duration of the animation.
	 * @param {Number} params.start - The start timestamp of the animation.
	 * @param {Number} params.delta - The positional delta of the animation.
	 * @param {Number} params.easing - The easing factor of the animation.
	 */
	constructor(params = {}) {
		super(params);
		this.start = params.start;
		this.delta = params.delta;
		this.end = {
			x: this.start.x + this.delta.x,
			y: this.start.y + this.delta.y,
		};
		this.easing = params.easing;
	}

	/**
	 * Updates the position of the plot based on the current state of the
	 * animation.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 */
	update(timestamp) {
		const t = this.getT(timestamp);
		// calculate the progress of the animation
		const progress = 1 - Math.pow(1 - t, 1 / this.easing);
		// caclulate the current position along the pan
		const plot = this.plot;
		// set the viewport positions
		plot.viewport.x = this.start.x + this.delta.x * progress;
		plot.viewport.y = this.start.y + this.delta.y * progress;
		// create pan event
		const event = new Event(plot);
		// check if animation is finished
		if (t < 1) {
			plot.emit(EventType.PAN, event);
			return false;
		}
		plot.emit(EventType.PAN_END, event);
		return true;
	}

	/**
	 * Cancels the current animation and removes it from the plot.
	 */
	cancel() {
		const plot = this.plot;
		// emit pan end
		plot.emit(EventType.PAN_END, new Event(plot));
	}

	/**
	 * Complete the current animation and remove it from the plot.
	 */
	finish() {
		const plot = this.plot;
		// set the viewport positions
		plot.viewport.x = this.end.x;
		plot.viewport.y = this.end.y;
		// emit pan end
		plot.emit(EventType.PAN_END, new Event(plot));
	}
}

module.exports = PanAnimation;
