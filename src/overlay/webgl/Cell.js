'use strict';

const Bounds = require('../../core/Bounds');

/**
 * The size of the cell.
 * @constant {Number}
 */
const CELL_SIZE = Math.pow(2, 16);

/**
 * The size of the cell regeneration buffer, will regenerate the cell if you are
 * within this many pixels to it's bounds.
 * @constant {Number}
 */
const CELL_BUFFER = Math.pow(2, 8);

/**
 * Class representing a cell for clipping a rendering space.
 */
class Cell {

	/**
	 * Instantiates a new Cell object.
	 */
	constructor(zoom, centerPx, tileSize) {
		const scale = Math.pow(2, zoom) * tileSize;
		const center = {
			x: centerPx.x / scale,
			y: centerPx.y / scale
		};
		const offsetPx = {
			x: centerPx.x - (CELL_SIZE / 2),
			y: centerPx.y - (CELL_SIZE / 2)
		};
		const halfSize = (CELL_SIZE / 2) / scale;
		this.zoom = zoom;
		this.halfSize = halfSize;
		this.buffer = CELL_BUFFER / scale;
		this.center = center;
		this.offsetPx = offsetPx;
		this.scale = scale;
		this.bounds = new Bounds(
			center.x - halfSize,
			center.x + halfSize,
			center.y - halfSize,
			center.y + halfSize);
	}

	/**
	 * Project a normalized plot coordinate to the pixel space of the cell.
	 *
	 * @param {Object} pos - The normalized plot coordinate.
	 *
	 * @returns {Object} The coordinate in cell pixel space.
	 */
	project(pos) {
		return {
			x: (pos.x * this.scale) - this.offsetPx.x,
			y: (pos.y * this.scale) - this.offsetPx.y
		};
	}

}

module.exports = Cell;
