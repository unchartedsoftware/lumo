'use strict';

/**
 * Maximum safe integer.
 * @private
 * @constant {Number}
 */
const MAX_SAFE_INT = Math.pow(2, 53) - 1;

// Private Methods

let uid = 1;
const getUID = function() {
	uid = (uid + 1) % MAX_SAFE_INT;
	return uid;
};

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
		this.uid = getUID();
		this.data = null;
		this.err = null;
	}
}

module.exports = Tile;
