'use strict';

/**
 * Class representing a tile.
 */
class Tile {

	/**
	 * Instantiates a new Bounds object.
	 *
	 * @param {Coord} coord - The coord of the tile.
	 */
	constructor(coord) {
		this.coord = coord;
		this.data = null;
		this.err = null;
	}
}

module.exports = Tile;
