'use strict';

const defaultTo = require('lodash/defaultTo');

/**
 * Class representing an index buffer.
 */
class IndexBuffer {

	/**
	 * Instantiates an IndexBuffer object.
	 *
	 * @param {WebGLRenderingContext} gl - The WebGL context.
	 * @param {WebGLBuffer|ArrayBuffer|number} arg - The index data to buffer.
	 * @param {object} options - The rendering options.
	 * @param {string} options.type - The buffer component type.
	 * @param {string} options.mode - The draw mode / primitive type.
	 * @param {string} options.byteOffset - The byte offset into the drawn buffer.
	 * @param {string} options.count - The number of vertices to draw.
	 */
	constructor(gl, arg, options = {}) {
		this.gl = gl;
		this.type = defaultTo(options.type, 'UNSIGNED_SHORT');
		this.mode = defaultTo(options.mode, 'TRIANGLES');
		this.count = defaultTo(options.count, 0);
		this.byteOffset = defaultTo(options.byteOffset, 0);
		// create buffer
		if (arg instanceof WebGLBuffer) {
			this.buffer = arg;
		} else {
			this.buffer = gl.createBuffer();
			if (arg) {
				// buffer the data
				this.bufferData(arg);
			}
		}
	}

	/**
	 * Upload index data to the GPU.
	 *
	 * @param {ArrayBuffer|number} arg - The array of data to buffer.
	 *
	 * @returns {IndexBuffer} The index buffer object, for chaining.
	 */
	bufferData(arg) {
		const gl = this.gl;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arg, gl.STATIC_DRAW);
	}

	/**
	 * Upload partial index data to the GPU.
	 *
	 * @param {ArrayBuffer} array - The array of data to buffer.
	 * @param {number} byteOffset - The byte offset at which to buffer.
	 *
	 * @returns {IndexBuffer} The index buffer object, for chaining.
	 */
	bufferSubData(array, byteOffset = 0) {
		const gl = this.gl;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
		gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, byteOffset, array);
		return this;
	}

	/**
	 * Execute the draw command for the bound buffer.
	 *
	 * @returns {IndexBuffer} The index buffer object, for chaining.
	 */
	draw() {
		const gl = this.gl;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
		gl.drawElements(gl[this.mode], this.count, gl[this.type], this.byteOffset);
		// no need to unbind
		return this;
	}
}

module.exports = IndexBuffer;
