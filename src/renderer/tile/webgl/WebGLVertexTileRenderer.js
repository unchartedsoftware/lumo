'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../../event/EventType');
const VertexAtlas = require('../../../webgl/vertex/VertexAtlas');
const WebGLTileRenderer = require('./WebGLTileRenderer');

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

// Private Methods

const addTile = function(atlas, tile) {
	atlas.set(
		tile.coord.hash,
		tile.data,
		tile.data.length / atlas.stride);
};

const removeTile = function(atlas, tile) {
	atlas.delete(tile.coord.hash);
};

/**
 * Class representing a vertex based webgl tile renderer.
 */
class WebGLVertexTileRenderer extends WebGLTileRenderer {

	/**
	 * Instantiates a new WebGLVertexTileRenderer object.
	 */
	constructor() {
		super();
		this[TILE_ADD] = new Map();
		this[TILE_REMOVE] = new Map();
	}

	/**
	 * Creates a vertex atlas of appropriate size for the layer pyramid using
	 * the provided attribute pointers. Creates and attaches the necessary
	 * event handlers to add and remove data from the atlas accordingly.
	 *
	 * @param {Object} options - The options for the vertex atlas.
	 * @param {Object} options.attributePointers - The vertex attribute pointers.
	 * @param {number} options.chunkSize - The size of a single chunk, in vertices.
	 * @param {Function} options.onAdd - The function executed when a tile is added.
	 * @param {Function} options.onRemove - The function executed when a tile is removed.
	 *
	 * @returns {VertexAtlas} The vertex atlas object.
	 */
	createVertexAtlas(options = {}) {
		// create vertex atlas
		const atlas = new VertexAtlas(
			this.gl,
			options.attributePointers,
			{
				// set num chunks to be able to fit the capacity of the pyramid
				numChunks: this.layer.pyramid.getCapacity(),
				chunkSize: options.chunkSize
			});
		// create handlers
		const onAdd = defaultTo(options.onAdd, addTile);
		const onRemove = defaultTo(options.onRemove, removeTile);
		const add = event => {
			onAdd(atlas, event.tile);
		};
		const remove = event => {
			onRemove(atlas, event.tile);
		};
		// attach handlers
		this.layer.on(EventType.TILE_ADD, add);
		this.layer.on(EventType.TILE_REMOVE, remove);
		// store the handlers under the atlas
		this[TILE_ADD].set(atlas, add);
		this[TILE_REMOVE].set(atlas, remove);
		return atlas;
	}

	/**
	 * Destroys a vertex atlas object and removes all event handlers used to add
	 * and remove data from the atlas.
	 *
	 * @param {VertexAtlas} atlas - The vertex atlas to destroy.
	 */
	destroyVertexAtlas(atlas) {
		// detach handlers
		this.layer.removeListener(EventType.TILE_ADD, this[TILE_ADD].get(atlas));
		this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_REMOVE].get(atlas));
		// remove handlers
		this[TILE_ADD].delete(atlas);
		this[TILE_REMOVE].delete(atlas);
	}
}

module.exports = WebGLVertexTileRenderer;
