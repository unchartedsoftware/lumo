'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../../event/EventType');
const RTreePyramid = require('../../../geometry/RTreePyramid');
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

/**
 * Class representing a vertex based webgl tile renderer.
 */
class WebGLVertexTileRenderer extends WebGLTileRenderer {

	/**
	 * Instantiates a new WebGLVertexTileRenderer object.
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
	 * Given a tile, returns an array of collidable objects. A collidable object
	 * is any object that contains `minX`, `minY`, `maxX`, and `maxY` properties.
	 *
	 * @param {Tile} tile - The tile of data.
	 * @param {number} xOffset - The pixel x offset of the tile.
	 * @param {number} yOffset - The pixel y offset of the tile.
	 */
	/* eslint-disable no-unused-vars */
	createCollidables(tile, xOffset, yOffset) {
		throw '`createCollidables` must be overridden';
	}

	/**
	 * Creates an rtree pyramid object. Creates and attaches the necessary
	 * event handlers to add and remove data from the rtree accordingly.
	 *
	 * @param {number} nodeCapacity - The node capacity of the rtree.
	 *
	 * @returns {VertexAtlas} The vertex atlas object.
	 */
	createRTreePyramid(nodeCapacity) {
		// create rtree pyramid
		const pyramid = new RTreePyramid({
			nodeCapacity: nodeCapacity
		});
		// create handlers
		const index = event => {
			const tile = event.tile;
			const coord = tile.coord;
			const tileSize = this.layer.plot.tileSize;
			const xOffset = coord.x * tileSize;
			const yOffset = coord.y * tileSize;
			const collidables = this.createCollidables(tile, xOffset, yOffset);
			pyramid.insert(coord, collidables);
		};
		const unindex = event => {
			pyramid.remove(event.tile.coord);
		};
		// attach handlers
		this.layer.on(EventType.TILE_ADD, index);
		this.layer.on(EventType.TILE_REMOVE, unindex);
		// store the handlers under the atlas
		this[TILE_ADD].set(pyramid, index);
		this[TILE_REMOVE].set(pyramid, unindex);
		return pyramid;
	}

	/**
	 * Destroys a vertex atlas object and removes all event handlers used to add
	 * and remove data from the atlas.
	 *
	 * @param {RTreePyramid} pyramid - The vertex atlas to destroy.
	 */
	destroyRTreePyramid(pyramid) {
		// detach handlers
		this.layer.removeListener(EventType.TILE_ADD, this[TILE_ADD].get(pyramid));
		this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_REMOVE].get(pyramid));
		// remove handlers
		this[TILE_ADD].delete(pyramid);
		this[TILE_REMOVE].delete(pyramid);
	}

	/**
	 * Creates a vertex atlas of appropriate size for the layer pyramid using
	 * the provided attribute pointers. Creates and attaches the necessary
	 * event handlers to add and remove data from the atlas accordingly.
	 *
	 * @param {Object} pointers - The vertex attribute pointers.
	 *
	 * @returns {VertexAtlas} The vertex atlas object.
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
