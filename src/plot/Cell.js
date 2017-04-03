'use strict';

const Bounds = require('../core/Bounds');

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
		const halfSize = (CELL_SIZE / 2) / scale;
		const offset = {
			x: center.x - halfSize,
			y: center.y - halfSize
		};
		const offsetPx = {
			x: centerPx.x - (CELL_SIZE / 2),
			y: centerPx.y - (CELL_SIZE / 2)
		};
		this.zoom = zoom;
		this.halfSize = halfSize;
		this.buffer = CELL_BUFFER / scale;
		this.center = center;
		this.offset = offset;
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
	 * @param {Number} zoom - The zoom of the plot pixel space to project to. Optional.
	 *
	 * @returns {Object} The coordinate in cell pixel space.
	 */
	project(pos, zoom = this.zoom) {
		const scale = Math.pow(2, zoom - this.zoom);
		return {
			x: (pos.x * this.scale * scale) - (this.offsetPx.x * scale),
			y: (pos.y * this.scale * scale) - (this.offsetPx.y * scale)
		};
	}

	/**
	 * Project a plot pixel coordinate to the pixel space of the cell.
	 *
	 * @param {Object} px - The plot pixel coordinate.
	 * @param {Number} zoom - The zoom of the plot pixel space to project to. Optional.
	 *
	 * @returns {Object} The coordinate in cell pixel space.
	 */
	projectPx(px, zoom = this.zoom) {
		// get scale between cell zoom and the provided zoom. This is used to
		// scale the cells offset pixels to the same pixel coordinate space.
		//
		// Ex. cell of offset [20, 40] at zoom = 1 should become [40, 80] at
		//     zoom 2.
		const scale = Math.pow(2, zoom - this.zoom);
		return {
			x: px.x - (this.offsetPx.x * scale),
			y: px.y - (this.offsetPx.y * scale)
		};
	}

}

module.exports = Cell;
