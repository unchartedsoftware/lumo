'use strict';

const Event = require('./Event');

/**
 * Class representing a draw event.
 */
class DrawEvent extends Event {

	/**
	 * Instantiates a new DrawEvent object.
	 *
	 * @param {Object} target - The object that fired the event.
	 * @param {Array} tiles - The tiles drawn.
	 */
	constructor(target, tiles) {
		super(target);
		this.tiles = tiles;
	}
}

module.exports = DrawEvent;
