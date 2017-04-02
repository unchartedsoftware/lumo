'use strict';

const Bounds = require('../core/Bounds');
const Coord = require('../core/Coord');

// Private Methods

const getVisibleTileBounds = function(viewport, tileSize, viewportZoom, tileZoom = viewportZoom, wraparound) {
	const bounds = viewport.getTileBounds(tileSize, viewportZoom, tileZoom);
	// min / max tile coords
	const dim = Math.pow(2, tileZoom);
	const min = 0;
	const max = dim - 1;
	// get the bounds of the zoom level
	const layerBounds = new Bounds(
		wraparound ? -Infinity : min,
		wraparound ? Infinity : max,
		min,
		max);
	// check if the layer is within the viewport
	if (!bounds.overlaps(layerBounds)) {
		// there is no overlap
		return undefined;
	}
	// clamp horizontal bounds if there is no wraparound
	const left = wraparound ? bounds.left : Math.max(min, bounds.left);
	const right = wraparound ? bounds.right : Math.min(max, bounds.right);
	// clamp vertical bounds
	const bottom = Math.max(min, bounds.bottom);
	const top = Math.min(max, bounds.top);
	return new Bounds(left, right, bottom, top);
};

const isWithinRange = function(min, max, m, n) {
	// Given:
	//    1) An integer range r = [min : max].
	//    2) An power-of-two integer m.
	//    3) An integer n within the within the range of [0 : m).
	//    4) An integer constant k.
	// Check if n, or any values of m +/- kn, is within the range R.
	//
	// Ex:
	//     min: -3
	//     max: 6
	//     m: 8
	//     n: 7
	//
	// Return true because 7 - 8 = -1, which is within the range -3 to 6.

	// within range
	if (min <= n && n <= max) {
		return true;
	}

	// if the range is above n, find how many m's fit
	// in the distance between n and min
	if (min > n) {
		const k = Math.ceil((min - n) / m);
		return n + k * m <= max;
	}

	// if the range is below n, find how many m's fit
	// in the distance between max and n
	const k = Math.ceil((n - max) / m);
	return n - k * m >= min;
};

/**
 * Class representing a viewport.
 */
class Viewport {

	/**
	 * Instantiates a new Viewport object.
	 *
	 * @param {Object} params - The viewport parameters.
	 * @param {Number} params.x - The x coordinate of the viewport.
	 * @param {Number} params.y - The y coordinate of the viewport.
	 * @param {Number} params.width - The width of the viewport.
	 * @param {Number} params.height - The height of the viewport.
	 */
	constructor(params = {}) {
		this.x = params.x ? params.x : 0;
		this.y = params.y ? params.y : 0;
		this.width = params.width ? Math.round(params.width) : 0;
		this.height = params.height ? Math.round(params.height) : 0;
	}

	/**
	 * Returns the pixel bounds of the viewport. Bounds edges are inclusive.
	 *
	 * @returns {Bounds} The pixel bounds of the viewport.
	 */
	getPixelBounds() {
		// NOTE: bounds are INCLUSIVE
		return new Bounds(
			this.x,
			this.x + this.width,
			this.y,
			this.y + this.height);
	}

	/**
	 * Returns the tile bounds of the viewport. Bounds edges are inclusive.
	 * NOTE: this includes wraparound coordinates
	 *
	 * @param {Number} tileSize - The dimension of the tiles, in pixels.
	 * @param {Number} viewportZoom - The zoom of the viewport.
	 * @param {Number} tileZoom - The zoom of the tiles within the viewport. Optional.
	 *
	 * @returns {Bounds} The tile bounds of the viewport.
	 */
	getTileBounds(tileSize, viewportZoom, tileZoom = viewportZoom) {
		// NOTE: bounds are INCLUSIVE
		// get the tile coordinate bounds for tiles from the tileZoom that
		// are visible from the viewportZoom.
		//	 Ex. if current viewport zoom is 3 and tile zoom is 5, the
		//		 tiles will be 25% of their normal size compared to the
		//		 viewport.
		const scale = Math.pow(2, viewportZoom - tileZoom);
		const scaledTileSize = tileSize * scale;
		return new Bounds(
			Math.floor(this.x / scaledTileSize),
			Math.ceil(((this.x + this.width) / scaledTileSize) - 1),
			Math.floor(this.y / scaledTileSize),
			Math.ceil(((this.y + this.height) / scaledTileSize) - 1));
	}

	/**
	 * Returns the coordinates that are visible in the viewport.
	 *
	 * @param {Number} tileSize - The dimension of the tiles, in pixels.
	 * @param {Number} viewportZoom - The zoom of the viewport.
	 * @param {Number} tileZoom - The zoom of the tiles within the viewport. Optional.
	 * @param {boolean} wraparound - The if the horizontal axis should wraparound. Optional.
	 *
	 * @returns {Array} The array of visible tile coords.
	 */
	getVisibleCoords(tileSize, viewportZoom, tileZoom = viewportZoom, wraparound = false) {
		// get the bounds for what tiles are in view
		const bounds = getVisibleTileBounds(
			this,
			tileSize,
			viewportZoom,
			tileZoom,
			wraparound);
		// check if no coords are in view
		if (!bounds) {
			return [];
		}
		// return an array of the coords
		const coords = [];
		for (let x=bounds.left; x<=bounds.right; x++) {
			for (let y=bounds.bottom; y<=bounds.top; y++) {
				coords.push(new Coord(tileZoom, x, y));
			}
		}
		return coords;
	}

	/**
	 * Returns the orthographic projection matrix for the viewport.
	 *
	 * @return {Float32Array} The orthographic projection matrix.
	 */
	getOrthoMatrix() {
		const left = 0;
		const right = this.width;
		const bottom = 0;
		const top = this.height;
		const near = -1;
		const far = 1;
		const lr = 1 / (left - right);
		const bt = 1 / (bottom - top);
		const nf = 1 / (near - far);
		const out = new Float32Array(16);
		out[0] = -2 * lr;
		out[1] = 0;
		out[2] = 0;
		out[3] = 0;
		out[4] = 0;
		out[5] = -2 * bt;
		out[6] = 0;
		out[7] = 0;
		out[8] = 0;
		out[9] = 0;
		out[10] = 2 * nf;
		out[11] = 0;
		out[12] = (left + right) * lr;
		out[13] = (top + bottom) * bt;
		out[14] = (far + near) * nf;
		out[15] = 1;
		return out;
	}

	/**
	 * Returns whether or not the provided coord is within the viewport.
	 *
	 * @param {Number} tileSize - The dimension of the tiles, in pixels.
	 * @param {Coord} coord - The coord.
	 * @param {Number} viewportZoom - The zoom of the viewport.
	 * @param {boolean} wraparound - The if the horizontal axis should wraparound. Optional.
	 *
	 * @return {boolean} Whether or not the coord is in view.
	 */
	isInView(tileSize, coord, viewportZoom, wraparound = false) {
		// get the bounds for what tiles are in view
		const bounds = getVisibleTileBounds(
			this,
			tileSize,
			viewportZoom,
			coord.z, // tile zoom
			wraparound);
		// check if no coords are in view
		if (!bounds) {
			return false;
		}
		const dim = Math.pow(2, coord.z);
		return isWithinRange(bounds.left, bounds.right, dim, coord.x) &&
			isWithinRange(bounds.bottom, bounds.top, dim, coord.y);
	}

	/**
	 * Returns a viewport that has been zoomed around it's center.
	 *
	 * @param {Number} tileSize - The dimension of the tiles, in pixels.
	 * @param {Number} zoom - The current zoom of the viewport.
	 * @param {Number} targetZoom - The target zoom of the viewport.
	 *
	 * @returns {Array} The array of visible tile coords.
	 */
	zoomFromPlotCenter(tileSize, zoom, targetZoom) {
		// get the current dimension
		const current = Math.pow(2, zoom);
		// get the next dimension
		const next = Math.pow(2, targetZoom);
		// determine the change in pixels to center the existing plot
		const change = tileSize * (next - current) / 2;
		// return new viewport
		const viewport = new Viewport({
			width: this.width,
			height: this.height,
			x: this.x + change,
			y: this.y + change
		});
		return viewport;
	}

	/**
	 * Returns a viewport that has been zoomed around a provided plot pixel.
	 *
	 * @param {Number} tileSize - The dimension of the tiles, in pixels.
	 * @param {Number} zoom - The current zoom of the viewport.
	 * @param {Number} targetZoom - The target zoom of the viewport.
	 * @param {Object} targetPx - The target pixel to zoom around.
	 *
	 * @returns {Array} The array of visible tile coords.
	 */
	zoomFromPlotPx(tileSize, zoom, targetZoom, targetPx) {
		// get the current dimension
		const current = Math.pow(2, zoom);
		// get the next dimension
		const next = Math.pow(2, targetZoom);
		// determine the change in pixels to center the existing plot
		const change = tileSize * (next - current) / 2;
		// get the half size of the plot at the current zoom
		const half = tileSize * current / 2;
		// get the distance from the plot center at the current zoom
		const diff = {
			x: targetPx.x - half,
			y: targetPx.y - half
		};
		// get the scaling between the two zoom levels
		const scale = Math.pow(2, targetZoom - zoom);
		// scale the diff, and subtract it's current value
		const scaledDiff = {
			x: diff.x * scale - diff.x,
			y: diff.y * scale - diff.y
		};
		// return new viewport
		const viewport = new Viewport({
			width: this.width,
			height: this.height,
			x: this.x + change + scaledDiff.x,
			y: this.y + change + scaledDiff.y
		});
		return viewport;
	}

	/**
	 * Returns the lower-left corner position of the viewport in plot pixel
	 * coordinates.
	 *
	 * @returns {Object} The plot pixel position.
	 */
	getPosition() {
		return {
			x: this.x,
			y: this.y
		};
	}

	/**
	 * Returns the center of the viewport in plot pixel coordinates.
	 *
	 * @returns {Object} The plot pixel center.
	 */
	getCenter() {
		return {
			x: this.x + this.width / 2,
			y: this.y + this.height / 2
		};
	}

	/**
	 * Centers the viewport on a given plot pixel coordinate.
	 *
	 * @param {Object} px - The plot pixel to center the viewport on.
	 *
	 * @returns {Viewport} The viewport object, for chaining.
	 */
	centerOn(px) {
		this.x = px.x - this.width / 2;
		this.y = px.y - this.height / 2;
	}
}

module.exports = Viewport;
