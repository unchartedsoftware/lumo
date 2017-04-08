'use strict';

/**
 * Class representing an animation.
 */
class Animation {

	/**
	 * Instantiates a new Animation object.
	 */
	constructor(plot) {
		this.timestamp = Date.now();
		this.plot = plot;
	}

	/**
	 * Updates the the plot based on the current state of the
	 * animation.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 */
	update() {
		throw 'Must implement';
	}

	/**
	 * Cancel the animation and remove it from the plot.
	 */
	cancel() {
		throw 'Must implement';
	}

	/**
	 * Complete the animation and remove it from the plot.
	 */
	finish() {
		throw 'Must implement';
	}
}

module.exports = Animation;
