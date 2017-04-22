'use strict';

const Bounds = require('../geometry/Bounds');

/**
 * The size of the cell, in pixels.
 * @constant {Number}
 */
const CELL_SIZE = Math.pow(2, 16);

/**
 * The half size of the cell, in pixels.
 * @constant {Number}
 */
const CELL_HALF_SIZE = CELL_SIZE / 2;
/**
 * Class representing a cell for clipping a rendering space.
 */
class Cell {

	/**
	 * Instantiates a new Cell object.
	 */
	constructor(zoom, center, extent) {
		const halfSize = CELL_HALF_SIZE / extent;
		const offset = {
			x: center.x - halfSize,
			y: center.y - halfSize
		};
		this.zoom = zoom;
		this.halfSize = halfSize;
		this.center = center;
		this.offset = offset;
		this.extent = extent;
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
	 * @param {Number} zoom - The zoom of the plot pixel space to project to. Optional.
	 *
	 * @returns {Object} The coordinate in cell pixel space.
	 */
	project(pos, zoom = this.zoom) {
		const scale = Math.pow(2, zoom - this.zoom) * this.extent;
		return {
			x: (pos.x - this.offset.x) * scale,
			y: (pos.y - this.offset.y) * scale
		};
	}

	/**
	 * Unproject a coordinate from the pixel space of the cell to a normalized
	 * plot coordinate.
	 *
	 * @param {Object} px - The plot pixel coordinate.
	 * @param {Number} zoom - The zoom of the plot pixel space to unproject from. Optional.
	 *
	 * @returns {Object} The normalized plot coordinate.
	 */
	unproject(px, zoom = this.zoom) {
		const scale = Math.pow(2, zoom - this.zoom) * this.extent;
		return {
			x: (px.x / scale) + this.offset.x,
			y: (px.y / scale) + this.offset.y
		};
	}

}

module.exports = Cell;
