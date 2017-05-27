'use strict';

const defaultTo = require('lodash/defaultTo');

/**
 * Class representing a canvas image array.
 */
class CanvasArray {

	/**
	 * Instantiates a new CanvasArray object.
	 *
	 * @param {Object} options - The image array options.
	 * @param {number} options.chunkSize - The dimension of each canvas, in pixels.
	 * @param {number} options.numChunks - The size of the array, in tiles.
	 * @param {bool} options.scaled - Whether or not the chunkSize should be scaled by the pixel ratio.
	 */
	constructor(options = {}) {
		this.chunkSize = defaultTo(options.chunkSize, 256);
		this.numChunks = defaultTo(options.numChunks, 256);
		// create images
		this.available = new Array(this.numChunks);
		for (let i=0; i<this.numChunks; i++) {
			const canvas = document.createElement('canvas');
			canvas.width = this.chunkSize;
			canvas.height = this.chunkSize;
			this.available[i] = {
				ctx: canvas.getContext('2d'),
				canvas: canvas
			};
		}
		// create used chunk map
		this.used = new Map();
	}

	/**
	 * Test whether or not a key is held in the array.
	 *
	 * @param {string} key - The key to test.
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
	 * @param {string} key - The key of the chunk to return.
	 *
	 * @returns {Object} The chunk object.
	 */
	get(key) {
		return this.used.get(key);
	}

	/**
	 * Allocates and returns the image for the provided key.
	 *
	 * @param {string} key - The key of the image data.
	 *
	 * @returns {HTMLCanvasElement} The canvas element.
	 */
	allocate(key) {
		if (this.has(key)) {
			throw `Tile of coord ${key} already exists in the array`;
		}
		if (this.available.length === 0) {
			throw 'No available image chunks in array';
		}
		// get an available chunk
		const chunk = this.available.pop();
		// add to used
		this.used.set(key, chunk);
		// clear the chunk
		chunk.ctx.clearRect(0, 0, this.chunkSize, this.chunkSize);
		return chunk;
	}

	/**
	 * Flags the chunk matching the provided key as unused in the array.
	 *
	 * @param {string} key - The key of the chunk to free.
	 *
	 * @returns {CanvasArray} The CanvasArray object, for chaining.
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
	 * Clears the array and resizes all chunks.
	 *
	 * @param {number} chunkSize - The size of a image, in pixels.
	 *
	 * @returns {CanvasArray} The CanvasArray object, for chaining.
	 */
	resize(chunkSize) {
		if (this.chunkSize === chunkSize) {
			return;
		}
		this.clear();
		const available = this.available;
		for (let i=0; i<available.length; i++) {
			const chunk = available[i];
			chunk.canvas.width = chunkSize;
			chunk.canvas.height = chunkSize;
		}
		this.chunkSize = chunkSize;
		return this;
	}

	/**
	 * Flags all chunks as unused.
	 *
	 * @returns {CanvasArray} The CanvasArray object, for chaining.
	 */
	clear() {
		this.used.forEach(chunk => {
			this.available.push(chunk);
		});
		this.used = new Map();
		return this;
	}

}

module.exports = CanvasArray;
