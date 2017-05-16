'use strict';

const defaultTo = require('lodash/defaultTo');

/**
 * Class representing a canvas image array.
 */
class CanvasArray {

	/**
	 * Instantiates a new CanvasArray object.
	 *
	 * @param {number} pixelSize - The size of a image, in pixels.
	 * @param {Object} options - The image array options.
	 * @param {number} options.numChunks - The size of the array, in tiles.
	 */
	constructor(pixelSize = 256, options = {}) {
		this.pixelSize = pixelSize;
		this.numChunks = defaultTo(options.numChunks, 256);
		// create images
		this.available = new Array(this.numChunks);
		for (let i=0; i<this.numChunks; i++) {
			const canvas = document.createElement('canvas');
			canvas.width = pixelSize;
			canvas.height = pixelSize;
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
		chunk.ctx.clearRect(0, 0, this.pixelSize, this.pixelSize);
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
	 * @param {number} pixelSize - The size of a image, in pixels.
	 *
	 * @returns {CanvasArray} The CanvasArray object, for chaining.
	 */
	resize(pixelSize) {
		if (this.pixelSize === pixelSize) {
			return;
		}
		this.clear();
		const available = this.available;
		for (let i=0; i<available.length; i++) {
			const chunk = available[i];
			chunk.canvas.width = pixelSize;
			chunk.canvas.height = pixelSize;
		}
		this.pixelSize = pixelSize;
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
