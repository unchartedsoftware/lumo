'use strict';

const Overlay = require('./Overlay');

// Private Methods

const clipPolylines = function(cell, polylines) {
	const clipped = [];
	polylines.forEach(polyline => {
		let current = [];
		for (let i=1; i<polyline.length; i++) {
			const a = polyline[i-1];
			const b = polyline[i];
			// clip the line
			const line = cell.bounds.clipLine(a, b);
			// no line in bounds
			if (!line) {
				continue;
			}
			// add src point
			current.push(cell.project(line.a));
			if (line.b.clipped || i === polyline.length - 1) {
				// only add destination point if it was clipped, or is last
				// point
				current.push(cell.project(line.b));
				// then break the polyline
				clipped.push(current);
				current = [];
			}
		}
		if (current.length > 0) {
			// add last polyline
			clipped.push(current);
		}
	});
	return clipped;
};

/**
 * Class representing a polyline overlay.
 */
class LineOverlay extends Overlay {

	/**
	 * Instantiates a new LineOverlay object.
	 *
	 * @param {Object} options - The layer options.
	 * @param {Renderer} options.renderer - The layer renderer.
	 * @param {number} options.opacity - The layer opacity.
	 * @param {number} options.zIndex - The layer z-index.
	 */
	constructor(options = {}) {
		super(options);
		this.polylines = new Map();
	}

	/**
	 * Add a set of points to render as a single polyline.
	 *
	 * @param {string} id - The id to store the polyline under.
	 * @param {Array} points - The polyline points.
	 *
	 * @returns {LineOverlay} The overlay object, for chaining.
	 */
	addPolyline(id, points) {
		this.polylines.set(id, points);
		if (this.plot) {
			this.refresh();
		}
		return this;
	}

	/**
	 * Remove a polyline by id from the overlay.
	 *
	 * @param {string} id - The id to store the polyline under.
	 *
	 * @returns {LineOverlay} The overlay object, for chaining.
	 */
	removePolyline(id) {
		this.polylines.delete(id);
		if (this.plot) {
			this.refresh();
		}
		return this;
	}

	/**
	 * Remove all polylines from the layer.
	 *
	 * @returns {LineOverlay} The overlay object, for chaining.
	 */
	clearPolylines() {
		this.clear();
		this.polylines = new Map();
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
	/* eslint-disable no-unused-vars */
	clipGeometry(cell) {
		return clipPolylines(cell, this.polylines);
	}
}

module.exports = LineOverlay;
