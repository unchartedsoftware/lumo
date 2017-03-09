'use strict';

const Shader = require('../../render/webgl/shader/Shader');
const Overlay = require('../Overlay');

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
		this.gl = null;
		super.onRemove(plot);
		return this;
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
