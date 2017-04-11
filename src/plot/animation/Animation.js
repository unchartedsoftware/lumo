'use strict';

/**
 * Class representing an animation.
 */
class Animation {

	/**
	 * Instantiates a new Animation object.
	 *
	 * @param {Object} params - The parameters of the animation.
	 * @param {Number} params.plot - The plot target of the animation.
	 * @param {Number} params.duration - The duration of the animation.
	 */
	constructor(params) {
		this.timestamp = Date.now();
		this.duration = params.duration;
		this.plot = params.plot;
	}

	/**
	 * Returns the t-value of the animation based on the provided timestamp.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 *
	 * @returns {Number} The t-value for the corresponding timestamp.
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
	 * @param {Number} timestamp - The frame timestamp.
	 *
	 * @returns {boolean} Whether or not the animation has finished.
	 */
	update() {
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
