'use strict';

const Overlay = require('./Overlay');

// Private Methods

const clipPolylines = function(cell, polylines) {
	const clipped = [];
	polylines.forEach(polyline => {
		// clip the polyline, resulting in multiple clipped polylines
		const clippedPolylines = cell.bounds.clipPolyline(polyline);
		if (!clippedPolylines) {
			return;
		}
		for (let i=0; i<clippedPolylines.length; i++) {
			const clippedPolyline = clippedPolylines[i];
			for (let j=0; j<clippedPolyline.length; j++) {
				// project in place
				clippedPolyline[j] = cell.project(clippedPolyline[j]);
			}
			clipped.push(clippedPolyline);
		}
	});
	return clipped;
};

/**
 * Class representing a polyline overlay.
 */
class PolylineOverlay extends Overlay {

	/**
	 * Instantiates a new PolylineOverlay object.
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
	 * @returns {PolylineOverlay} The overlay object, for chaining.
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
	 * @returns {PolylineOverlay} The overlay object, for chaining.
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
	 * @returns {PolylineOverlay} The overlay object, for chaining.
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
	 * Return the clipped geometry based on the current cell.
	 *
	 * @param {Cell} cell - The rendering cell.
	 *
	 * @returns {Array} The array of clipped geometry.
	 */
	clipGeometry(cell) {
		return clipPolylines(cell, this.polylines);
	}
}

module.exports = PolylineOverlay;
