'use strict';

const Event = require('./Event');

/**
 * Class representing a resize event.
 */
class ResizeEvent extends Event {

	/**
	 * Instantiates a new ResizeEvent object.
	 *
	 * @param {Object} target - The object that fired the event.
	 * @param {Number} oldSize - The old size of the viewport.
	 * @param {Number} newSize - The new size of the viewport.
	 */
	constructor(target, oldSize, newSize) {
		super(target);
		this.oldSize = oldSize;
		this.newSize = newSize;
	}
}

module.exports = ResizeEvent;
