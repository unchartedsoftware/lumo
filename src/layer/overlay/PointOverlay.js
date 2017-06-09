'use strict';

const Overlay = require('./Overlay');

// Private Methods

const clipPoints = function(cell, points) {
	const clipped = [];
	points.forEach(pts => {
		const clippedPoints = cell.bounds.clipPoints(pts);
		if (!clippedPoints) {
			return;
		}
		for (let i=0; i<clippedPoints.length; i++) {
			clipped.push(cell.project(clippedPoints[i]));
		}
	});
	return clipped;
};

/**
 * Class representing a point overlay.
 */
class PointOverlay extends Overlay {

	/**
	 * Instantiates a new PointOverlay object.
	 *
	 * @param {Object} options - The layer options.
	 * @param {number} options.opacity - The layer opacity.
	 * @param {number} options.zIndex - The layer z-index.
	 */
	constructor(options = {}) {
		super(options);
		this.points = new Map();
	}

	/**
	 * Add a set of points to render.
	 *
	 * @param {string} id - The id to store the points under.
	 * @param {Array} points - The points.
	 *
	 * @returns {PointOverlay} The overlay object, for chaining.
	 */
	addPoints(id, points) {
		this.points.set(id, points);
		if (this.plot) {
			this.refresh();
		}
		return this;
	}

	/**
	 * Remove a set of points by id from the overlay.
	 *
	 * @param {string} id - The id to store the points under.
	 *
	 * @returns {PointOverlay} The overlay object, for chaining.
	 */
	removePoints(id) {
		this.points.delete(id);
		if (this.plot) {
			this.refresh();
		}
		return this;
	}

	/**
	 * Remove all points from the layer.
	 *
	 * @returns {PointOverlay} The overlay object, for chaining.
	 */
	clearPoints() {
		this.clear();
		this.points = new Map();
		if (this.plot) {
			this.refresh();
		}
		return this;
	}

	/**
	 * Given an array of point based geometry, return the clipped geometry.
	 *
	 * @param {Cell} cell - The rendering cell.
	 *
	 * @returns {Array} The array of clipped geometry.
	 */
	clipGeometry(cell) {
		return clipPoints(cell, this.points);
	}
}

module.exports = PointOverlay;
