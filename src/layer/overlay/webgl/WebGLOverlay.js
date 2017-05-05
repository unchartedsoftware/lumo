'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../../event/EventType');
const Shader = require('../../../webgl/shader/Shader');
const Overlay = require('../Overlay');

// Constants

/**
 * Cell update event handler symbol.
 * @private
 * @constant {Symbol}
 */
const CELL_UPDATE = Symbol();

/**
 * Class representing an overlay.
 */
class WebGLOverlay extends Overlay {

	/**
	 * Instantiates a new WebGLOverlay object.
	 *
	 * @param {Object} options - The layer options.
	 * @param {Renderer} options.renderer - The layer renderer.
	 * @param {number} options.opacity - The layer opacity.
	 * @param {number} options.zIndex - The layer z-index.
	 */
	constructor(options = {}) {
		super(options);
		this.gl = null;
		this.cell = null;
		this.buffers = null;
		this[CELL_UPDATE] = null;
	}

	/**
	 * Executed when the overlay is attached to a plot.
	 *
	 * @param {Plot} plot - The plot to attach the overlay to.
	 *
	 * @returns {WebGLOverlay} The overlay object, for chaining.
	 */
	onAdd(plot) {
		super.onAdd(plot);
		this.gl = this.plot.gl;
		// generate the buffers
		this.refreshBuffers();
		// create refresh handler
		this[CELL_UPDATE] = () => {
			this.refreshBuffers();
		};
		this.plot.on(EventType.CELL_UPDATE, this[CELL_UPDATE]);
		return this;
	}

	/**
	 * Executed when the overlay is removed from a plot.
	 *
	 * @param {Plot} plot - The plot to remove the overlay from.
	 *
	 * @returns {WebGLOverlay} The overlay object, for chaining.
	 */
	onRemove(plot) {
		this.plot.removeListener(EventType.CELL_UPDATE, this[CELL_UPDATE]);
		this[CELL_UPDATE] = null;
		this.buffers = null;
		this.gl = null;
		super.onRemove(plot);
		return this;
	}

	/**
	 * Check if the render cell needs to be refreshed, if so, refresh it.
	 *
	 * @returns {WebGLOverlay} The overlay object, for chaining.
	 */
	refreshBuffers() {
		if (!this.plot) {
			throw 'Overlay is not attached to a plot';
		}
		// get cell
		const cell = this.plot.cell;
		// generate new buffers
		const buffers = defaultTo(this.createBuffers(cell), []);
		this.buffers = Array.isArray(buffers) ? buffers : [ buffers ];
	}

	/**
	 * Create and return an array of VertexBuffers.
	 *
	 * @param {Cell} cell - The rendering cell.
	 *
	 * @returns {Array} The array of VertexBuffer objects.
	 */
	/* eslint-disable no-unused-vars */
	createBuffers(cell) {
		throw '`createBuffers` must be overridden';
	}

	/**
	 * Instantiate and return a new Shader object using the overlays internal
	 * WebGLRenderingContext.
	 *
	 * @param {Object} source - The shader param object.
	 * @param {string} source.common - Common glsl to be shared by both vertex and fragment shaders.
	 * @param {string} source.vert - The vertex shader glsl.
	 * @param {string} source.frag - The fragment shader glsl.
	 *
	 * @returns {Shader} The shader object.
	 */
	createShader(source) {
		return new Shader(this.gl, source);
	}

	/**
	 * Returns the orthographic projection matrix for the viewport.
	 *
	 * @returns {Float32Array} The orthographic projection matrix.
	 */
	getOrthoMatrix() {
		return this.plot.getOrthoMatrix();
	}

}

module.exports = WebGLOverlay;
