'use strict';

/**
 * Class representing an animation.
 */
class Animation {

	/**
	 * Instantiates a new Animation object.
	 *
	 * @param {object} params - The parameters of the animation.
	 * @param {number} params.plot - The plot target of the animation.
	 * @param {number} params.duration - The duration of the animation.
	 */
	constructor(params) {
		this.timestamp = Date.now();
		this.duration = params.duration;
		this.plot = params.plot;
	}

	/**
	 * Returns the t-value of the animation based on the provided timestamp.
	 *
	 * @param {number} timestamp - The frame timestamp.
	 *
	 * @returns {number} The t-value for the corresponding timestamp.
	 */
	getT(timestamp) {
		if (this.duration > 0) {
			return Math.min(1.0, (timestamp - this.timestamp) / this.duration);
		}
		return 1.0;
	}

	/**
	 * Updates the the plot based on the current state of the
	 * animation.
	 *
	 * @param {number} timestamp - The frame timestamp.
	 *
	 * @returns {boolean} Whether or not the animation has finished.
	 */
	/* eslint-disable no-unused-vars */
	update(timestamp) {
		return true;
	}

	/**
	 * Cancel the animation and remove it from the plot.
	 */
	cancel() {
	}

	/**
	 * Complete the animation and remove it from the plot.
	 */
	finish() {
	}
}

module.exports = Animation;
