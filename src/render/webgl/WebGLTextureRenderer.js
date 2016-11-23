'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../event/EventType');
const WebGLRenderer = require('./WebGLRenderer');
const TextureArray = require('./texture/TextureArray');

// Constants

/**
 * Add tile handler symbol.
 * @private
 * @constant
 */
const TILE_ADD = Symbol();

/**
 * Remove tile handler symbol.
 * @private
 * @constant
 */
const TILE_REMOVE = Symbol();

/**
 * Class representing a texture based webgl renderer.
 */
class WebGLTextureRenderer extends WebGLRenderer {

	/**
	 * Instantiates a new WebGLTextureRenderer object.
	 *
	 * @param {Object} options - The options object.
	 */
	constructor(options = {}) {
		super(options);
		this.format = defaultTo(options.format, 'RGBA');
		this.type = defaultTo(options.type, 'UNSIGNED_BYTE');
		this.filter = defaultTo(options.filter, 'LINEAR');
		this.invertY = defaultTo(options.invertY, false);
		this.premultiplyAlpha = defaultTo(options.premultiplyAlpha, false);
	}

	/**
	 * Executed when a tile is added to the layer pyramid.
	 *
	 * @param {TextureArray} array - The texture array object.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	addTile(array, tile) {
		array.set(tile.coord.hash, tile.data);
	}

	/**
	 * Executed when a tile is removed from the layer pyramid.
	 *
	 * @param {TextureArray} array - The texture array object.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	removeTile(array, tile) {
		array.delete(tile.coord.hash);
	}

	/**
	 * Creates a texture array of appropriate size for the layer pyramid using
	 * the provided texture size. Creates and attaches the necessary event
	 * handlers to add and remove data from the array accordingly.
	 *
	 * @param {Number} textureSize - The resolution of the tile texture.
	 */
	createTextureArray(textureSize) {
		// create texture array
		const array = new TextureArray(
			this.gl,
			textureSize,
			{
				// set num chunks to be able to fit the capacity of the pyramid
				numChunks: this.layer.pyramid.totalCapacity,
				// set texture attributes
				format: this.format,
				filter: this.filter,
				invertY: this.invertY,
				premultiplyAlpha: this.premultiplyAlpha
			});
		// create handlers
		const add = event => {
			this.addTile(array, event.tile);
		};
		const remove = event => {
			this.removeTile(array, event.tile);
		};
		// attach handlers
		this.layer.on(EventType.TILE_ADD, add);
		this.layer.on(EventType.TILE_REMOVE, remove);
		// store the handlers under the array
		const handlers = new Map([
			[ TILE_ADD, add ],
			[ TILE_REMOVE, remove ]
		]);
		this.handlers.set(array, handlers);
		// return the array
		return array;
	}

	/**
	 * Destroys a texture array object and removes all event handlers used to
	 * add and remove data from the array.
	 */
	destroyTextureArray(array) {
		// get handlers associated with the array
		const handlers = this.handlers.get(array);
		// detach handlers
		this.layer.removeListener(EventType.TILE_ADD, handlers.get(TILE_ADD));
		this.layer.removeListener(EventType.TILE_REMOVE, handlers.get(TILE_REMOVE));
		// destroy handlers
		this.handlers.delete(array);
	}
}

module.exports = WebGLTextureRenderer;
