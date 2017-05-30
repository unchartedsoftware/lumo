'use strict';

const Renderer = require('../Renderer');

/**
 * Class representing an overlay renderer.
 */
class OverlayRenderer extends Renderer {

	/**
	 * Instantiates a new OverlayRenderer object.
	 */
	constructor() {
		super();
		this.overlay = null;
	}

	/**
	 * Executed when the overlay is attached to a plot.
	 *
	 * @param {Overlay} overlay - The overlay to attach the renderer to.
	 *
	 * @returns {OverlayRenderer} The renderer object, for chaining.
	 */
	onAdd(overlay) {
		if (!overlay) {
			throw 'No overlay provided as argument';
		}
		this.overlay = overlay;
		return this;
	}

	/**
	 * Executed when the overlay is removed from a plot.
	 *
	 * @param {Overlay} overlay - The overlay to remove the renderer from.
	 *
	 * @returns {OverlayRenderer} The renderer object, for chaining.
	 */
	onRemove(overlay) {
		if (!overlay) {
			throw 'No overlay provided as argument';
		}
		this.overlay = null;
		return this;
	}
}

module.exports = OverlayRenderer;
