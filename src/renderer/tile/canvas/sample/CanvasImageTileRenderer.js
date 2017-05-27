'use strict';

const CanvasTileRenderer = require('../CanvasTileRenderer');

/**
 * Class representing a canvas image tile renderer.
 */
class CanvasImageTileRenderer extends CanvasTileRenderer {

	/**
	 * Instantiates a new CanvasImageTileRenderer object.
	 *
	 * @param {Object} options - The options object.
	 */
	constructor(options = {}) {
		super(options);
		this.array = null;
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {CanvasImageTileRenderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		super.onAdd(layer);
		this.array = this.createCanvasArray({
			chunkSize: layer.plot.tileSize
		});
		return this;
	}

	/**
	 * Executed when the layer is removed from a plot.
	 *
	 * @param {Layer} layer - The layer to remove the renderer from.
	 *
	 * @returns {CanvasImageTileRenderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		this.destroyCanvasArray(this.array);
		this.array = null;
		super.onRemove(layer);
		return this;
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {CanvasImageTileRenderer} The renderer object, for chaining.
	 */
	draw() {
		// draw the pre-rendered images
		this.drawCanvasRenderablesLOD(this.array, false);
		return this;
	}
}

module.exports = CanvasImageTileRenderer;
