'use strict';

const EventEmitter = require('events');

/**
 * Class representing a renderer.
 */
class Renderer extends EventEmitter {

	/**
	 * Instantiates a new Renderer object.
	 */
	constructor() {
		super();
	}

	/**
	 * Executed when the target is attached to a plot.
	 *
	 * @param {target} target - The target to attach the renderer to.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	/* eslint-disable no-unused-vars */
	onAdd(target) {
		return this;
	}

	/**
	 * Executed when the target is removed from a plot.
	 *
	 * @param {Overlay} target - The target to remove the renderer from.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	/* eslint-disable no-unused-vars */
	onRemove(target) {
		return this;
	}

	/**
	 * Pick a position of the layer for a collision with any rendered objects.
	 *
	 * @param {Object} pos - The plot position to pick at.
	 *
	 * @returns {Object} The collision, or null.
	 */
	/* eslint-disable no-unused-vars */
	pick(pos) {
		return null;
	}

	/**
	 * Clears any persisted state in the renderer.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	clear() {
		return this;
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @param {number} timestamp - The frame timestamp.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	/* eslint-disable no-unused-vars */
	draw(timestamp) {
		return this;
	}
}

module.exports = Renderer;
