'use strict';

const defaultTo = require('lodash/defaultTo');
const EventEmitter = require('events');

/**
 * Class representing an renderable component.
 */
class Renderable extends EventEmitter {

	/**
	 * Instantiates a new Renderable object.*
	 *
	 * @param {Object} options - The options.
	 * @param {Number} options.opacity - The opacity.
	 * @param {Number} options.zIndex - The z-index.
	 */
	constructor(options = {}) {
		super();
		this.opacity = defaultTo(options.opacity, 1.0);
		this.hidden = defaultTo(options.hidden, false);
		this.zIndex = defaultTo(options.zIndex, 0);
		this.highlighted = null;
		this.selected = [];
		this.plot = null;
		this.handlers = null;
	}

	/**
	 * Executed when the renderable is attached to a plot.
	 *
	 * @param {Plot} plot - The plot to attach the renderable to.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
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
	 * Executed when the renderable is removed from a plot.
	 *
	 * @param {Plot} plot - The plot to remove the renderable from.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	onRemove(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		// remove plot
		this.plot = null;
		this.handlers = null;
		// clear state
		this.clear();
		return this;
	}

	/**
	 * Make the renderable visible.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	show() {
		this.hidden = false;
		return this;
	}

	/**
	 * Make the renderable invisible.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	hide() {
		this.hidden = true;
		return this;
	}

	/**
	 * Returns true if the renderable is hidden.
	 *
	 * @returns {boolean} Whether or not the renderable is hidden.
	 */
	isHidden() {
		return this.hidden;
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	draw() {
		return this;
	}

	/**
	 * Pick a position of the renderable for a collision with any rendered
	 * objects.
	 *
	 * @param {Object} pos - The plot position to pick at.
	 *
	 * @returns {Object} The collision, or null.
	 */
	pick() {
		return null;
	}

	/**
	 * Clears any persisted state in the renderable.
	 *
	 * @returns {Renderable} The renderable object, for chaining.
	 */
	clear() {
		// clear selected / highlighted
		this.highlighted = null;
		this.selected = [];
		return this;
	}
}

module.exports = Renderable;
