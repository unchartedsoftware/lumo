'use strict';

const Event = require('./Event');

/**
 * Class representing a resize event.
 */
class ResizeEvent extends Event {

	/**
	 * Instantiates a new ResizeEvent object.
	 *
	 * @param {Number} plot - The resized plot object.
	 * @param {Number} prevSize - The previous size of the plot.
	 * @param {Number} targetSize - The new size of the plot.
	 */
	constructor(plot, prevSize, targetSize) {
		super();
		this.plot = plot;
		this.prevSize = prevSize;
		this.targetSize = targetSize;
	}
}

module.exports = ResizeEvent;
