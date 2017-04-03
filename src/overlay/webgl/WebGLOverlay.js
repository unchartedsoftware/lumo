'use strict';

const defaultTo = require('lodash/defaultTo');
const Shader = require('../../render/webgl/shader/Shader');
const EventType = require('../../event/EventType');
const Overlay = require('../Overlay');

// Constants

/**
 * Cell update event handler symbol.
 * @constant {Symbol}
 */
const CELL_UPDATE = Symbol();

/**
 * Class representing an overlay.
 */
class WebGLOverlay extends Overlay {

	/**
	 * Instantiates a new WebGLOverlay object.
	 */
	constructor(options = {}) {
		super(options);
		this.gl = null;
		this.cell = null;
		this.buffers = null;
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
		// create refresh handlers
		const update = () => {
			this.refreshBuffers();
		};
		this.handlers.set(CELL_UPDATE, update);
		this.plot.on(EventType.CELL_UPDATE, update);
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
		this.plot.removeListener(EventType.CELL_UPDATE, this.handlers.get(CELL_UPDATE));
		this.handlers.delete(CELL_UPDATE);
		this.buffers = null;
		this.gl = null;
		super.onRemove(plot);
		return this;
	}

	/**
	 * Check if the render cell needs to be refreshed, if so, refresh it.
	 *
	 * @param {boolean} force - Force the refresh.
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
	createBuffers() {
		throw '`createBuffers` must be overridden';
	}

	/**
	 * Instantiate and return a new Shader object using the overlays internal
	 * WebGLRenderingContext.
	 * @param {Object} params - The shader param object.
	 * @param {String} params.common - Common glsl to be shared by both vertex and fragment shaders.
	 * @param {String} params.vert - The vertex shader glsl.
	 * @param {String} params.frag - The fragment shader glsl.
	 *
	 * @returns {Shader} The shader object.
	 */
	createShader(source) {
		return new Shader(this.gl, source);
	}

	/**
	 * Returns the orthographic projection matrix for the viewport.
	 *
	 * @return {Float32Array} The orthographic projection matrix.
	 */
	getOrthoMatrix() {
		return this.plot.viewport.getOrthoMatrix();
	}

}

module.exports = WebGLOverlay;
