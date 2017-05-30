'use strict';

const EventType = require('../../event/EventType');
const Layer = require('../Layer');

// Constants

/**
 * Cell update event handler symbol.
 * @private
 * @constant {Symbol}
 */
const CELL_UPDATE = Symbol();

/**
 * Clipped geometry symbol.
 * @private
 * @constant {Symbol}
 */
const CLIPPED = Symbol();

/**
 * Class representing an overlay layer.
 */
class Overlay extends Layer {

	/**
	 * Instantiates a new Overlay object.
	 *
	 * @param {Object} options - The overlay options.
	 * @param {number} options.opacity - The overlay opacity.
	 * @param {number} options.zIndex - The overlay z-index.
	 * @param {boolean} options.hidden - Whether or not the overlay is visible.
	 */
	constructor(options = {}) {
		super(options);
		this[CLIPPED] = null;
		this[CELL_UPDATE] = null;
	}

	/**
	 * Executed when the overlay is attached to a plot.
	 *
	 * @param {Plot} plot - The plot to attach the overlay to.
	 *
	 * @returns {Overlay} The overlay object, for chaining.
	 */
	onAdd(plot) {
		super.onAdd(plot);
		// clip existing geometry
		this.refresh();
		// create cell update handler
		this[CELL_UPDATE] = () => {
			this.refresh();
		};
		// attach handler
		this.plot.on(EventType.CELL_UPDATE, this[CELL_UPDATE]);
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
		// remove clipped geometry
		this[CLIPPED] = null;
		// remove handler
		this.plot.removeListener(EventType.CELL_UPDATE, this[CELL_UPDATE]);
		// create refresh handler
		this[CELL_UPDATE] = null;
		super.onRemove(plot);
		return this;
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

	/**
	 * Clears any persisted state in the overlay and refreshes the underlying
	 * data. This involves refreshing the stored clipped geometry of the
	 * overlay based the current rendering cell of the plot.
	 *
	 * @returns {Overlay} The overlay object, for chaining.
	 */
	refresh() {
		if (this.plot) {
			this[CLIPPED] = this.clipGeometry(this.plot.cell);
		}
		super.refresh();
		return this;
	}

	/**
	 * Given an array of point based geometry, return the clipped geometry.
	 *
	 * @param {Cell} cell - The rendering cell.
	 *
	 * @returns {Array} The array of clipped geometry.
	 */
	/* eslint-disable no-unused-vars */
	clipGeometry(cell) {
		throw '`clipGeometry` must be overridden';
	}

	/**
	 * Returns the clipped geometry for the overlay.
	 *
	 * @returns {Array} The array of clipped geometry.
	 */
	getClippedGeometry() {
		return this[CLIPPED];
	}
}

module.exports = Overlay;
