'use strict';

const OverlayRenderer = require('../OverlayRenderer');

/**
 * Class representing a canvas overlay renderer.
 */
class CanvasOverlayRenderer extends OverlayRenderer {

	/**
	 * Instantiates a new CanvasOverlayRenderer object.
	 *
	 * @param {Object} options - The overlay options.
	 * @param {Renderer} options.renderer - The overlay renderer.
	 * @param {number} options.opacity - The overlay opacity.
	 * @param {number} options.zIndex - The overlay z-index.
	 */
	constructor(options = {}) {
		super(options);
		this.ctx = null;
	}

	/**
	 * Executed when the overlay is attached to a plot.
	 *
	 * @param {Overlay} overlay - The overlay to attach the renderer to.
	 *
	 * @returns {CanvasOverlayRenderer} The renderer object, for chaining.
	 */
	onAdd(overlay) {
		super.onAdd(overlay);
		this.ctx = this.overlay.plot.getRenderingContext();
		return this;
	}

	/**
	 * Executed when the overlay is removed from a plot.
	 *
	 * @param {Overlay} overlay - The overlay to remove the renderer from.
	 *
	 * @returns {CanvasOverlayRenderer} The renderer object, for chaining.
	 */
	onRemove(overlay) {
		this.ctx = null;
		super.onRemove(overlay);
		return this;
	}
}

module.exports = CanvasOverlayRenderer;
