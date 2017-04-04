'use strict';

const defaultTo = require('lodash/defaultTo');
const EventEmitter = require('events');

/**
 * Class representing an overlay.
 */
class Overlay extends EventEmitter {

	/**
	 * Instantiates a new DOMOverlay object.*
	 *
	 * @param {Object} options - The overlay options.
	 * @param {Number} options.opacity - The overlay opacity.
	 * @param {Number} options.zIndex - The overlay z-index.
	 */
	constructor(options = {}) {
		super();
		this.opacity = defaultTo(options.opacity, 1.0);
		this.hidden = defaultTo(options.hidden, false);
		this.zIndex = defaultTo(options.zIndex, 0);
		this.plot = null;
		this.handlers = null;
	}

	/**
	 * Executed when the overlay is attached to a plot.
	 *
	 * @param {Plot} plot - The plot to attach the overlay to.
	 *
	 * @returns {Overlay} The overlay object, for chaining.
	 */
	onAdd(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		// set plot
		this.plot = plot;
		this.handlers = new Map();
		return this;
	}

	/**
	 * Executed when the overlay is removed from a plot.
	 *
	 * @param {Plot} plot - The plot to remove the overlay from.
	 *
	 * @returns {Overlay} The overlay object, for chaining.
	 */
	onRemove(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		// remove plot
		this.plot = null;
		this.handlers = null;
		return this;
	}

	/**
	 * Make the overlay visible.
	 *
	 * @returns {Overlay} The overlay object, for chaining.
	 */
	show() {
		this.hidden = false;
		return this;
	}

	/**
	 * Make the overlay invisible.
	 *
	 * @returns {Overlay} The overlay object, for chaining.
	 */
	hide() {
		this.hidden = true;
		return this;
	}

	/**
	 * Returns true if the overlay is hidden.
	 *
	 * @returns {boolean} Whether or not the overlay is hidden.
	 */
	isHidden() {
		return this.hidden;
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 *
	 * @returns {Overlay} The overlay object, for chaining.
	 */
	draw() {
		return this;
	}

	/**
	 * Clears any persisted state in the overlay.
	 *
	 * @returns {Overlay} The overlay object, for chaining.
	 */
	clear() {
		return this;
	}
}

module.exports = Overlay;
