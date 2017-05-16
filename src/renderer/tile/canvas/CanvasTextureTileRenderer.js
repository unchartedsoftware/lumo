'use strict';

const CanvasTileRenderer = require('./CanvasTileRenderer');

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
	 * Executed when a tile is added to the layer pyramid.
	 *
	 * @param {CanvasArray} array - The canvas array object.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	addTile(array, tile) {
		const data = tile.data;
		const chunk = array.allocate(tile.coord.hash);
		if (data.width !== undefined && data.height !== undefined) {
			// image
			chunk.ctx.drawImage(data, 0, 0);
		} else {
			// buffer
			const resolution = Math.sqrt(data.length / 4);
			const imageData = chunk.ctx.getImageData(0, 0, resolution, resolution);
			imageData.data.set(data);
			chunk.ctx.putImageData(imageData, 0, 0);
		}
	}
}

module.exports = CanvasTextureTileRenderer;
