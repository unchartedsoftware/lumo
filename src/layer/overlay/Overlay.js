'use strict';

const Layer = require('../Layer');

/**
 * Class representing an overlay layer.
 */
class Overlay extends Layer {

	/**
	 * Instantiates a new Overlay object.
	 *
	 * @param {Object} options - The overlay options.
	 * @param {Number} options.opacity - The overlay opacity.
	 * @param {Number} options.zIndex - The overlay z-index.
	 * @param {boolean} options.hidden - Whether or not the overlay is visible.
	 */
	constructor(options = {}) {
		super(options);
	}

	/**
	 * Unmutes and shows the overlay.
	 *
	 * @returns {Overlay} The overlay object, for chaining.
	 */
	enable() {
		this.show();
		return this;
	}

	/**
	 * Mutes and hides the overlay.
	 *
	 * @returns {Overlay} The overlay object, for chaining.
	 */
	disable() {
		this.hide();
		return this;
	}

	/**
	 * Returns true if the overlay is disabled.
	 *
	 * @returns {boolean} Whether or not the overlay is disabled.
	 */
	isDisabled() {
		return this.isHidden();
	}
}

module.exports = Overlay;
