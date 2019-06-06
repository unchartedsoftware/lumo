'use strict';

const Event = require('./Event');

/**
 * Class representing a tile event.
 */
class TileEvent extends Event {

	/**
	 * Instantiates a new TileEvent object.
	 *
	 * @param {object} target - The object that fired the event.
	 * @param {number} tile - The tile object.
	 */
	constructor(target, tile) {
		super(target);
		this.tile = tile;
	}
}

module.exports = TileEvent;
