'use strict';

const CanvasTileRenderer = require('./CanvasTileRenderer');

// Private Methods

const addTile = function(array, tile) {
	const data = tile.data;
	const chunk = array.allocate(tile.coord.hash);
	if (data.width !== undefined && data.height !== undefined) {
		// image
		chunk.ctx.drawImage(data, 0, 0);
	} else {
		// buffer
		const resolution = Math.sqrt(data.length / 4);
		const imageData = chunk.ctx.getImageData(0, 0, resolution, resolution);
		imageData.data.set(new Uint8ClampedArray(data));
		chunk.ctx.putImageData(imageData, 0, 0);
	}
};

/**
 * Class representing a canvas texture based tile renderer.
 */
class CanvasTextureTileRenderer extends CanvasTileRenderer {

	/**
	 * Instantiates a new CanvasTextureTileRenderer object.
	 *
	 * @param {Object} options - The options object.
	 */
	constructor(options = {}) {
		super(options);
	}

	/**
	 * Creates an image of appropriate size for the layer pyramid using
	 * the provided image size. Creates and attaches the necessary event
	 * handlers to add and remove data from the array accordingly.
	 *
	 * @param {number} pixelSize - The resolution of the images.
	 * @param {bool} scaled - Whether or not the pixel size will be scaled by the pixel ratio.
	 *
	 * @returns {CanvasArray} The image array object.
	 */
	createCanvasArray(pixelSize, scaled) {
		return super.createCanvasArray(pixelSize, scaled, addTile);
	}
}

module.exports = CanvasTextureTileRenderer;
