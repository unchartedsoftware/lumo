'use strict';

const TileRenderer = require('../TileRenderer');

/**
 * Class representing a canvas tile renderer.
 */
class CanvasTileRenderer extends TileRenderer {

	/**
	 * Instantiates a new CanvasTileRenderer object.
	 *
	 * @param {Object} options - The options object.
	 */
	constructor(options = {}) {
		super(options);
		this.ctx = null;
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {CanvasTileRenderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		super.onAdd(layer);
		this.ctx = this.layer.plot.getRenderingContext();
		return this;
	}

	/**
	 * Executed when the layer is removed from a plot.
	 *
	 * @param {Layer} layer - The layer to remove the renderer from.
	 *
	 * @returns {CanvasTileRenderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		this.ctx = null;
		super.onRemove(layer);
		return this;
	}
}

module.exports = CanvasTileRenderer;
