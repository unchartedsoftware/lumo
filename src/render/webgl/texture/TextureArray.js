'use strict';

const defaultTo = require('lodash/defaultTo');

// Private Methods

const createTexture = function(gl, format, size, type, filter, invertY, premultiplyAlpha) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, invertY);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiplyAlpha);
	// buffer the data
	gl.texImage2D(
		gl.TEXTURE_2D,
		0, // mip-map level
		gl[format], // webgl requires format === internalFormat
		size,
		size,
		0, // border, must be 0
		gl[format],
		gl[type],
		null);
	// set parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[filter]);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[filter]);
	return texture;
};

/**
 * Class representing a texture array.
 */
class TextureArray {

	/**
	 * Instantiates a new TextureArray object.
	 *
	 * NOTE: we use a texture array rather than a texture atlas because of
	 * the sub-pixel bleeding that occurs in the atlas when textures are
	 * not padded. Due to the overhead of padding clientside, the
	 * frequency of load load events, and the average number of tiles on
	 * the screen at any one time, binding individual tile textures
	 * provides a less volatile frame rate compared to padding textures and
	 * using an atlas.
	 *
	 * @param {WebGLRenderingContext} gl - The WebGL context.
	 * @param {Number} tileSize - The size of a tile, in pixels.
	 * @param {Object} options - The texture array options.
	 * @param {Number} options.numChunks - The size of the array, in tiles.
	 */
	constructor(gl, tileSize = 256, options = {}) {
		this.gl = gl;
		this.numChunks = defaultTo(options.numChunks, 256);
		this.chunkSize = tileSize;
		// set texture properties
		this.format = defaultTo(options.format, 'RGBA');
		this.type = defaultTo(options.type, 'UNSIGNED_BYTE');
		this.filter = defaultTo(options.filter, 'LINEAR');
		this.invertY = defaultTo(options.invertY, false);
		this.premultiplyAlpha = defaultTo(options.premultiplyAlpha, false);
		// create textures
		this.available = new Array(this.numChunks);
		for (let i=0; i<this.numChunks; i++) {
			this.available[i] = {
				texture: createTexture(
					this.gl,
					this.format,
					this.chunkSize,
					this.type,
					this.filter,
					this.invertY,
					this.premultiplyAlpha)
			};
		}
		// create used chunk map
		this.used = new Map();
	}

	/**
	 * Test whether or not a key is held in the array.
	 *
	 * @param {String} key - The key to test.
	 *
	 * @returns {boolean} Whether or not the coord exists in the pyramid.
	 */
	has(key) {
		return this.used.has(key);
	}

	/**
	 * Returns the chunk matching the provided key. If the chunk does not
	 * exist, returns undefined.
	 *
	 * @param {String} key - The key of the chunk to return.
	 *
	 * @returns {Object} The chunk object.
	 */
	get(key) {
		return this.used.get(key);
	}

	/**
	 * Set the texture data for the provided key.
	 *
	 * @param {String} key - The key of the texture data.
	 * @param {ArrayBuffer|HTMLCanvasElement|HTMLImageElement} data - The texture data.
	 */
	set(key, data) {
		if (this.has(key)) {
			throw `Tile of coord ${key} already exists in the array`;
		}
		if (this.available.length === 0) {
			throw 'No available texture chunks in array';
		}
		// get an available chunk
		const chunk = this.available.pop();
		// buffer the data
		const gl = this.gl;
		gl.bindTexture(gl.TEXTURE_2D, chunk.texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.invertY);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);
		if (data.width && data.height) {
			// canvas type
			gl.texImage2D(
				gl.TEXTURE_2D,
				0, // mip-map level
				gl[this.format], // webgl requires format === internalFormat
				gl[this.format],
				gl[this.type],
				data);
		} else {
			// arraybuffer type
			gl.texImage2D(
				gl.TEXTURE_2D,
				0, // mip-map level
				gl[this.format], // webgl requires format === internalFormat
				this.chunkSize,
				this.chunkSize,
				0, // border, must be 0
				gl[this.format],
				gl[this.type],
				data);
		}
		// add to used
		this.used.set(key, chunk);
	}

	/**
	 * Flags the chunk matching the provided key as unused in the array.
	 *
	 * @param {String} key - The key of the chunk to free.
	 *
	 * @returns {TextureArray} The TextureArray object, for chaining.
	 */
	delete(key) {
		if (!this.has(key)) {
			throw `Tile of coord ${key} does not exist in the array`;
		}
		// get chunk
		const chunk = this.used.get(key);
		// remove from used
		this.used.delete(key);
		// add to available
		this.available.push(chunk);
		return this;
	}

	/**
	 * Binds the texture array to the provided texture unit.
	 *
	 * @param {String} key - The key of the chunk to bind.
	 * @param {String} location - The texture unit to activate. Optional.
	 *
	 * @returns {TextureArray} The TextureArray object, for chaining.
	 */
	bind(key, location = 0) {
		if (!this.has(key)) {
			throw `Tile of coord ${key} does not exist in the array`;
		}
		const gl = this.gl;
		const chunk = this.used.get(key);
		gl.activeTexture(gl[`TEXTURE${location}`]);
		gl.bindTexture(gl.TEXTURE_2D, chunk.texture);
		return this;
	}

	/**
	 * Unbinds the texture array.
	 *
	 * @returns {TextureArray} The TextureArray object, for chaining.
	 */
	unbind() {
		// no-op
		return this;
	}
}

module.exports = TextureArray;
