'use strict';

const defaultTo = require('lodash/defaultTo');
const forIn = require('lodash/forIn');

// Constants

const BYTES_PER_TYPE = {
	BYTE: 1,
	UNSIGNED_BYTE: 1,
	SHORT: 2,
	UNSIGNED_SHORT: 2,
	FIXED: 4,
	FLOAT: 4
};

// Private Methods

const getStride = function(pointers) {
	// if there is only one attribute pointer assigned to this buffer,
	// there is no need for stride, set to default of 0
	if (pointers.size === 1) {
		return 0;
	}
	let maxByteOffset = 0;
	let byteSizeSum = 0;
	let byteStride = 0;
	pointers.forEach(pointer => {
		const byteOffset = pointer.byteOffset;
		const size = pointer.size;
		const type = pointer.type;
		// track the sum of each attribute size
		byteSizeSum += size * BYTES_PER_TYPE[type];
		// track the largest offset to determine the byte stride of the buffer
		if (byteOffset > maxByteOffset) {
			maxByteOffset = byteOffset;
			byteStride = byteOffset + (size * BYTES_PER_TYPE[type]);
		}
	});
	// check if the max byte offset is greater than or equal to the the sum
	// of the sizes. If so this buffer is not interleaved and does not need
	// a stride.
	if (maxByteOffset >= byteSizeSum) {
		// TODO: test what stride === 0 does for an interleaved buffer of
		// length === 1.
		return 0;
	}
	return byteStride;
};

const getAttributePointers = function(attributePointers) {
	// parse pointers to ensure they are valid
	const pointers = new Map();
	forIn(attributePointers, (pointer, key) => {
		// parse index from string to int
		const index = parseInt(key, 10);
		// ensure byte offset exists
		pointer.byteOffset = defaultTo(pointer.byteOffset, 0);
		// add to map
		pointers.set(index, pointer);
	});
	return pointers;
};

/**
 * @class VertexBuffer
 * @classdesc A vertex buffer object.
 */
class VertexBuffer {

	/**
	 * Instantiates an VertexBuffer object.
	 *
	 * @param {WebGLRenderingContext} gl - The WebGL context.
	 * @param {WebGLBuffer|ArrayBuffer|Number} arg - The buffer or length of the buffer.
	 * @param {Object} pointers - The array pointer map.
	 * @param {Object} options - The vertex buffer options.
	 * @param {String} options.mode - The draw mode / primitive type.
	 * @param {String} options.indexOffset - The index offset into the drawn buffer.
	 * @param {String} options.count - The number of indices to draw.
	 */
	constructor(gl, arg, pointers = {}, options = {}) {
		this.gl = gl;
		this.mode = defaultTo(options.mode, 'TRIANGLES');
		this.count = defaultTo(options.count, 0);
		this.indexOffset = defaultTo(options.indexOffset, 0);
		// first, set the attribute pointers
		this.pointers = getAttributePointers(pointers);
		// set the byte stride
		this.byteStride = getStride(this.pointers);
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
	 * Upload vertex data to the GPU.
	 *
	 * @param {ArrayBuffer|Number} arg - The array of data to buffer, or size of the buffer in bytes.
	 *
	 * @return {VertexBuffer} The vertex buffer object, for chaining.
	 */
	bufferData(arg) {
		const gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, arg, gl.STATIC_DRAW);
	}

	/**
	 * Upload partial vertex data to the GPU.
	 *
	 * @param {ArrayBuffer} array - The array of data to buffer.
	 * @param {Number} byteOffset - The byte offset at which to buffer.
	 *
	 * @return {VertexBuffer} The vertex buffer object, for chaining.
	 */
	bufferSubData(array, byteOffset = 0) {
		const gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, byteOffset, array);
		return this;
	}

	/**
	 * Binds the vertex buffer object.
	 *
	 * @return {VertexBuffer} - Returns the vertex buffer object for chaining.
	 */
	bind() {
		const gl = this.gl;
		// bind buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		// for each attribute pointer
		this.pointers.forEach((pointer, index) => {
			// set attribute pointer
			gl.vertexAttribPointer(
				index,
				pointer.size,
				gl[pointer.type],
				false,
				this.byteStride,
				pointer.byteOffset);
			// enable attribute index
			gl.enableVertexAttribArray(index);
		});
		return this;
	}

	/**
	 * Unbinds the vertex buffer object.
	 *
	 * @return {VertexBuffer} The vertex buffer object, for chaining.
	 */
	unbind() {
		const gl = this.gl;
		this.pointers.forEach((pointer, index) => {
			// disable attribute index
			gl.disableVertexAttribArray(index);
		});
		return this;
	}

	/**
	 * Execute the draw command for the bound buffer.
	 *
	 * @return {VertexBuffer} The vertex buffer object, for chaining.
	 */
	draw() {
		const gl = this.gl;
		gl.drawArrays(gl[this.mode], this.indexOffset, this.count);
		return this;
	}
}

module.exports = VertexBuffer;
