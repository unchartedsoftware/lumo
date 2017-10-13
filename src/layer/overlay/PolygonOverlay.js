'use strict';

const Overlay = require('./Overlay');

// Private Methods

const clipPolygons = function(cell, polygons) {
	const clipped = [];
	polygons.forEach(polygon => {
		const clippedPolygon = cell.bounds.clipPolygon(polygon);
		if (!clippedPolygon) {
			return;
		}
		const result = new Array(clippedPolygon.length);
		for (let i=0; i<clippedPolygon.length; i++) {
			result[i] = cell.project(clippedPolygon[i]);
		}
		clipped.push(result);
	});
	return clipped;
};

/**
 * Class representing a polygon overlay.
 */
class PolygonOverlay extends Overlay {

	/**
	 * Instantiates a new PolygonOverlay object.
	 *
	 * @param {Object} options - The layer options.
	 * @param {Renderer} options.renderer - The layer renderer.
	 * @param {number} options.opacity - The layer opacity.
	 * @param {number} options.zIndex - The layer z-index.
	 */
	constructor(options = {}) {
		super(options);
		this.polygons = new Map();
	}

	/**
	 * Add a set of points to render as a single polygon.
	 *
	 * @param {string} id - The id to store the polygon under.
	 * @param {Array} points - The polygon points.
	 *
	 * @returns {PolygonOverlay} The overlay object, for chaining.
	 */
	addPolygon(id, points) {
		this.polygons.set(id, points);
		if (this.plot) {
			this.refresh();
		}
		return this;
	}

	/**
	 * Remove a polygon by id from the overlay.
	 *
	 * @param {string} id - The id to store the polygon under.
	 *
	 * @returns {PolygonOverlay} The overlay object, for chaining.
	 */
	removePolygon(id) {
		this.polygons.delete(id);
		if (this.plot) {
			this.refresh();
		}
		return this;
	}

	/**
	 * Remove all polygons from the layer.
	 *
	 * @returns {PolygonOverlay} The overlay object, for chaining.
	 */
	clearPolylines() {
		this.clear();
		this.polygons = new Map();
		if (this.plot) {
			this.refresh();
		}
		return this;
	}

	/**
	 * Return the clipped geometry based on the current cell.
	 *
	 * @param {Cell} cell - The rendering cell.
	 *
	 * @returns {Array} The array of clipped geometry.
	 */
	clipGeometry(cell) {
		return clipPolygons(cell, this.polygons);
	}
}

module.exports = PolygonOverlay;
