'use strict';

const defaultTo = require('lodash/defaultTo');
const RTree = require('./RTree');

/**
 * Class representing a pyramid of r-trees.
 */
class RTreePyramid {

	/**
	 * Instantiates a new RTreePyramid object.
	 *
	 * @param {Object} options - The options object.
	 * @param {boolean} options.nodeCapacity - The node capacity of the r-tree.
	 */
	constructor(options) {
		this.trees = new Map();
		this.collidables = new Map();
		this.nodeCapacity = defaultTo(options.nodeCapacity, 32);
	}

	/**
	 * Inserts an array of collidables into the r-tree for the provided coord.
	 *
	 * @param {TileCoord} coord - The coord of the tile.
	 * @param {Array} collidables - The array of collidables to insert.
	 *
	 * @returns {RTreePyramid} The RTreePyramid object, for chaining.
	 */
	insert(coord, collidables) {
		if (!this.trees.has(coord.z)) {
			this.trees.set(coord.z, new RTree({
				nodeCapacity: this.nodeCapacity
			}));
		}
		this.trees.get(coord.z).insert(collidables);
		this.collidables.set(coord.hash, collidables);
		return this;
	}

	/**
	 * Removes an array of collidables from the r-tree for the provided coord.
	 *
	 * @param {TileCoord} coord - The coord of the tile.
	 *
	 * @returns {RTreePyramid} The RTreePyramid object, for chaining.
	 */
	remove(coord) {
		const collidables = this.collidables.get(coord.hash);
		this.trees.get(coord.z).remove(collidables);
		this.collidables.delete(coord.hash);
		return this;
	}

	/**
	 * Searchs the r-tree using a point.
	 *
	 * @param {number} x - The x component.
	 * @param {number} y - The y component.
	 * @param {number} zoom - The zoom level of the plot.
	 * @param {number} extent - The pixel extent of the plot zoom.
	 *
	 * @returns {Object} The collision object.
	 */
	searchPoint(x, y, zoom, extent) {
		// points are stored in un-scaled coordinates, unscale the point
		const tileZoom = Math.round(zoom);
		// get the tree for the zoom
		const tree = this.trees.get(tileZoom);
		if (!tree) {
			// no data for tile
			return null;
		}
		const scale = Math.pow(2, tileZoom - zoom);
		// unscaled points
		const sx = x * extent * scale;
		const sy = y * extent * scale;
		// get collision
		return tree.searchPoint(sx, sy);
	}

	/**
	 * Searchs the r-tree using a rectangle.
	 *
	 * @param {number} minX - The minimum x component.
	 * @param {number} maxX - The maximum x component.
	 * @param {number} minY - The minimum y component.
	 * @param {number} maxY - The maximum y component.
	 * @param {number} zoom - The zoom level of the plot.
	 * @param {number} extent - The pixel extent of the plot zoom.
	 *
	 * @returns {Object} The collision object.
	 */
	searchRectangle(minX, maxX, minY, maxY, zoom, extent) {
		// points are stored in un-scaled coordinates, unscale the point
		const tileZoom = Math.round(zoom);
		// get the tree for the zoom
		const tree = this.trees.get(tileZoom);
		if (!tree) {
			// no data for tile
			return null;
		}
		const scale = Math.pow(2, tileZoom - zoom);
		// unscaled points
		const sminX = minX * extent * scale;
		const smaxX = maxX * extent * scale;
		const sminY = minY * extent * scale;
		const smaxY = maxY * extent * scale;
		// get collision
		return tree.searchRectangle(sminX, smaxX, sminY, smaxY);
	}
}

module.exports = RTreePyramid;
