'use strict';

const Event = require('./Event');

/**
 * Class representing a tile event.
 */
class TileEvent extends Event {

	/**
	 * Instantiates a new TileEvent object.
	 *
	 * @param {Number} layer - The layer object.
	 * @param {Number} tile - The tile object.
	 */
	constructor(layer, tile) {
		super();
		this.layer = layer;
		this.tile = tile;
	}
}

module.exports = TileEvent;
