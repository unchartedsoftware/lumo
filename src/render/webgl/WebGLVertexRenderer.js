'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../event/EventType');
const WebGLRenderer = require('./WebGLRenderer');
const VertexAtlas = require('./vertex/VertexAtlas');

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
				numChunks: this.layer.pyramid.totalCapacity,
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
		const handlers = new Map([
			[ TILE_ADD, add ],
			[ TILE_REMOVE, remove ]
		]);
		this.handlers.set(atlas, handlers);
		return atlas;
	}

	/**
	 * Destroys a vertex atlas object and removes all event handlers used to add
	 * and remove data from the atlas.
	 */
	destroyVertexAtlas(atlas) {
		// get handlers associated with the atlas
		const handlers = this.handlers.get(atlas);
		// detach handlers
		this.layer.removeListener(EventType.TILE_ADD, handlers.get(TILE_ADD));
		this.layer.removeListener(EventType.TILE_REMOVE, handlers.get(TILE_REMOVE));
		// destroy handlers
		this.handlers.delete(atlas);
	}
}

module.exports = WebGLVertexRenderer;
