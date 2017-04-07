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
		this.layer = null;
		this.handlers = null;
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		if (!layer) {
			throw 'No layer provided as argument';
		}
		this.layer = layer;
		this.handlers = new Map();
		return this;
	}

	/**
	 * Executed when the layer is removed from a plot.
	 *
	 * @param {Layer} layer - The layer to remove the renderer from.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		if (!layer) {
			throw 'No layer provided as argument';
		}
		this.layer = null;
		this.handlers = null;
		return this;
	}

	/**
	 * Executed when an event occurs on the plot. Return any interpretted events
	 * relating to the renderer.
	 *
	 * @param {Event} type - Th event type to process.
	 * @param {Event} event - The plot-level event to process.
	 *
	 * @returns {Event} The renderer-level event.
	 */
	pick() {
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
	 * @param {Number} timestamp - The frame timestamp.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	draw() {
		return this;
	}
}

module.exports = Renderer;
