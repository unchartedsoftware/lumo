'use strict';

const defaultTo = require('lodash/defaultTo');

/**
 * Class representing a texture.
 */
class Texture {

	/**
	 * Instantiates a Texture object.
	 *
	 * @param {WebGLRenderingContext} gl - The WebGL context.
	 * @param {ArrayBuffer|CanvasElement} src - The data to buffer.
	 * @param {Object} options - The texture options.
	 * @param {number} options.width - The width of the texture.
	 * @param {number} options.height - The height of the texture.
	 * @param {string} options.format - The texture pixel format.
	 * @param {string} options.type - The texture pixel component type.
	 * @param {string} options.filter - The min / mag filter used during scaling.
	 * @param {string} options.wrap - The wrapping type over both S and T dimension.
	 * @param {bool} options.invertY - Whether or not invert-y is enabled.
	 * @param {bool} options.premultiplyAlpha - Whether or not alpha premultiplying is enabled.
	 */
	constructor(gl, src = null, options = {}) {
		this.gl = gl;
		this.texture = gl.createTexture();
		// set texture properties
		this.format = defaultTo(options.format, 'RGBA');
		this.type = defaultTo(options.type, 'UNSIGNED_BYTE');
		this.filter = defaultTo(options.filter, 'LINEAR');
		this.wrap = defaultTo(options.wrap, 'CLAMP_TO_EDGE');
		this.invertY = defaultTo(options.invertY, false);
		this.premultiplyAlpha = defaultTo(options.premultiplyAlpha, false);
		// buffer the data
		this.bufferData(src, options.width, options.height);
		// set parameters
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[this.wrap]);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[this.wrap]);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[this.filter]);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[this.filter]);
	}

	/**
	 * Binds the texture object to the provided texture unit location.
	 *
	 * @param {number} location - The texture unit location index. Optional.
	 *
	 * @returns {Texture} The texture object, for chaining.
	 */
	bind(location = 0) {
		const gl = this.gl;
		gl.activeTexture(gl[`TEXTURE${location}`]);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		return this;
	}

	/**
	 * Unbinds the texture object.
	 *
	 * @returns {Texture} The texture object, for chaining.
	 */
	unbind() {
		const gl = this.gl;
		gl.bindTexture(gl.TEXTURE_2D, null);
		return this;
	}

	/**
	 * Buffer data into the texture.
	 *
	 * @param {Array|ArrayBufferView|null} data - The data array to buffer.
	 * @param {number} width - The width of the data.
	 * @param {number} height - The height of the data.
	 *
	 * @returns {Texture} The texture object, for chaining.
	 */
	bufferData(data, width, height) {
		const gl = this.gl;
		// bind texture
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.invertY);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);
		// buffer the data
		if (data && data.width && data.height) {
			// store width and height
			this.width = data.width;
			this.height = data.height;
			// buffer the texture
			gl.texImage2D(
				gl.TEXTURE_2D,
				0, // mip-map level
				gl[this.format], // webgl requires format === internalFormat
				gl[this.format],
				gl[this.type],
				data);
		} else {
			// store width and height
			this.width = width || this.width;
			this.height = height || this.height;
			// buffer the texture data
			gl.texImage2D(
				gl.TEXTURE_2D,
				0, // mip-map level
				gl[this.format], // webgl requires format === internalFormat
				this.width,
				this.height,
				0, // border, must be 0
				gl[this.format],
				gl[this.type],
				data);
		}
		return this;
	}

	/**
	 * Buffer partial data into the texture.
	 *
	 * @param {Array|ArrayBufferView|null} data - The data array to buffer.
	 * @param {number} xOffset - The x offset at which to buffer.
	 * @param {number} yOffset - The y offset at which to buffer.
	 * @param {number} width - The width of the data.
	 * @param {number} height - The height of the data.
	 *
	 * @returns {Texture} The texture object, for chaining.
	 */
	bufferSubData(data, xOffset = 0, yOffset = 0, width = undefined, height = undefined) {
		const gl = this.gl;
		// bind texture
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.invertY);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);
		// buffer the data
		if (data.width && data.height) {
			// buffer the texture
			gl.texSubImage2D(
				gl.TEXTURE_2D,
				0, // mip-map level
				xOffset,
				yOffset,
				gl[this.format],
				gl[this.type],
				data);
		} else {
			// buffer the texture data
			gl.texSubImage2D(
				gl.TEXTURE_2D,
				0, // mip-map level
				xOffset,
				yOffset,
				width,
				height,
				gl[this.format],
				gl[this.type],
				data);
		}
		return this;
	}

	/**
	 * Resize the underlying texture. This clears the texture data.
	 *
	 * @param {number} width - The new width of the texture.
	 * @param {number} height - The new height of the texture.
	 *
	 * @returns {Texture} The texture object, for chaining.
	 */
	resize(width, height) {
		this.bufferData(null, width, height);
		return this;
	}
}

module.exports = Texture;
