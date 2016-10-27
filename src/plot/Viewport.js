'use strict';

const Bounds = require('../core/Bounds');
const Coord = require('../core/Coord');

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
			this.x + this.width - 1,
			this.y,
			this.y + this.height - 1);
	}

	/**
	 * Returns the pixel bounds of the viewport. Bounds edges are inclusive.
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
		//		 tiles will be 25% of there normal size compared to the
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
		const bounds = this.getTileBounds(tileSize, viewportZoom, tileZoom);
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
			return [];
		}
		// clamp horizontal bounds if there is no wraparound
		const left = wraparound ? bounds.left : Math.max(min, bounds.left);
		const right = wraparound ? bounds.right : Math.min(max, bounds.right);
		// clamp vertical bounds
		const bottom = Math.max(min, bounds.bottom);
		const top = Math.min(max, bounds.top);
		const coords = [];
		for (let x=left; x<=right; x++) {
			for (let y=bottom; y<=top; y++) {
				coords.push(new Coord(tileZoom, x, y));
			}
		}
		return coords;
	}

	/**
	 * Returns whether or not the provided coord is within the viewport.
	 *
	 * @param {Number} tileSize - The dimension of the tiles, in pixels.
	 * @param {Coord} coord - The coord.
	 * @param {Number} viewportZoom - The zoom of the viewport.
	 *
	 * @return {boolean} Whether or not the coord is in view.
	 */
	isInView(tileSize, coord, viewportZoom) {
		const viewportBounds = this.getPixelBounds();
		const tileBounds = coord.getPixelBounds(tileSize, viewportZoom);
		return viewportBounds.overlaps(tileBounds);
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
