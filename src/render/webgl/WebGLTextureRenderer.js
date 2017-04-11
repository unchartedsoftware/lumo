'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../event/EventType');
const WebGLRenderer = require('./WebGLRenderer');
const TextureArray = require('./texture/TextureArray');

// Constants

/**
 * Tile add handler symbol.
 * @private
 * @constant {Symbol}
 */
const TILE_ADD = Symbol();

/**
 * Tile remove handler symbol.
 * @private
 * @constant {Symbol}
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
		this[TILE_ADD] = new Map();
		this[TILE_REMOVE] = new Map();
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
				numChunks: this.layer.pyramid.getCapacity(),
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
		this[TILE_ADD].set(array, add);
		this[TILE_REMOVE].set(array, remove);
		return array;
	}

	/**
	 * Destroys a texture array object and removes all event handlers used to
	 * add and remove data from the array.
	 */
	destroyTextureArray(array) {
		// detach handlers
		this.layer.removeListener(EventType.TILE_ADD, this[TILE_ADD].get(array));
		this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_REMOVE].get(array));
		// remove handlers
		this[TILE_ADD].delete(array);
		this[TILE_REMOVE].delete(array);
	}
}

module.exports = WebGLTextureRenderer;
