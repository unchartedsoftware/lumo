'use strict';

const Shader = require('../../webgl/shader/Shader');
const EventType = require('../../event/EventType');
const OverlayRenderer = require('./OverlayRenderer');

// Constants

/**
 * Refresh event handler symbol.
 * @private
 * @constant {Symbol}
 */
const REFRESH = Symbol();

/**
 * Class representing a webgl overlay renderer.
 */
class WebGLOverlayRenderer extends OverlayRenderer {

	/**
	 * Instantiates a new WebGLOverlayRenderer object.
	 *
	 * @param {Object} options - The overlay options.
	 */
	constructor(options = {}) {
		super(options);
		this.gl = null;
		this[REFRESH] = null;
	}

	/**
	 * Executed when the overlay is attached to a plot.
	 *
	 * @param {Layer} overlay - The overlay to attach the renderer to.
	 *
	 * @returns {WebGLOverlayRenderer} The renderer object, for chaining.
	 */
	onAdd(overlay) {
		super.onAdd(overlay);
		this.gl = this.overlay.plot.getRenderingContext();
		// create buffers
		this.refreshBuffers();
		// create refresh handler
		this[REFRESH] = () => {
			this.refreshBuffers();
		};
		// attach refresh handler
		this.overlay.on(EventType.REFRESH, this[REFRESH]);
		return this;
	}

	/**
	 * Executed when the overlay is removed from a plot.
	 *
	 * @param {Layer} overlay - The overlay to remove the renderer from.
	 *
	 * @returns {WebGLOverlayRenderer} The renderer object, for chaining.
	 */
	onRemove(overlay) {
		// remove refresh handler
		this.overlay.removeListener(EventType.REFRESH, this[REFRESH]);
		// destroy refresh handler
		this[REFRESH] = null;
		this.gl = null;
		super.onRemove(overlay);
		return this;
	}

	/**
	 * Generate any underlying buffers.
	 *
	 * @returns {WebGLOverlayRenderer} The overlay object, for chaining.
	 */
	refreshBuffers() {
		throw '`refreshBuffers` must be overridden';
	}

	/**
	 * Instantiate and return a new Shader object using the renderers internal
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
		return this.overlay.plot.getOrthoMatrix();
	}
}

module.exports = WebGLOverlayRenderer;
