'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../event/EventType');
const VertexAtlas = require('../../webgl/vertex/VertexAtlas');
const WebGLRenderer = require('./WebGLRenderer');

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
 * Class representing a vertex based webgl renderer.
 */
class WebGLVertexRenderer extends WebGLRenderer {

	/**
	 * Instantiates a new WebGLVertexRenderer object.
	 *
	 * @param {Object} options - The options object.
	 * @param {Array} options.maxVertices - The max number of vertices per tile.
	 */
	constructor(options = {}) {
		super(options);
		this.maxVertices = defaultTo(options.maxVertices, 128 * 128);
		this[TILE_ADD] = new Map();
		this[TILE_REMOVE] = new Map();
	}

	/**
	 * Executed when a tile is added to the layer pyramid.
	 *
	 * @param {VertexAtlas} atlas - The vertex atlas object.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	addTile(atlas, tile) {
		atlas.set(
			tile.coord.hash,
			tile.data,
			tile.data.length / atlas.stride);
	}

	/**
	 * Executed when a tile is removed from the layer pyramid.
	 *
	 * @param {VertexAtlas} atlas - The vertex atlas object.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	removeTile(atlas, tile) {
		atlas.delete(tile.coord.hash);
	}

	/**
	 * Creates a vertex atlas of appropriate size for the layer pyramid using
	 * the provided attribute pointers. Creates and attaches the necessary
	 * event handlers to add and remove data from the atlas accordingly.
	 *
	 * @param {Object} pointers - The vertex attribute pointers.
	 */
	createVertexAtlas(pointers) {
		// create vertex atlas
		const atlas = new VertexAtlas(
			this.gl,
			pointers, {
				// set num chunks to be able to fit the capacity of the pyramid
				numChunks: this.layer.pyramid.getCapacity(),
				chunkSize: this.maxVertices
			});
		// create handlers
		const add = event => {
			this.addTile(atlas, event.tile);
		};
		const remove = event => {
			this.removeTile(atlas, event.tile);
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

module.exports = WebGLVertexRenderer;
