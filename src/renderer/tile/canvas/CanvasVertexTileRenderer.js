'use strict';

const EventType = require('../../../event/EventType');
const RTreePyramid = require('../../../geometry/RTreePyramid');
const CanvasTileRenderer = require('./CanvasTileRenderer');

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
 * Tile index handler symbol.
 * @private
 * @constant {Symbol}
 */
const TILE_INDEX = Symbol();

/**
 * Tile unindex handler symbol.
 * @private
 * @constant {Symbol}
 */
const TILE_UNINDEX = Symbol();

/**
 * Class representing a canvas vertex based tile renderer.
 */
class CanvasVertexTileRenderer extends CanvasTileRenderer {

	/**
	 * Instantiates a new CanvasVertexTileRenderer object.
	 *
	 * @param {Object} options - The options object.
	 */
	constructor(options = {}) {
		super(options);
		this[TILE_ADD] = null;
		this[TILE_REMOVE] = null;
		this[TILE_INDEX] = new Map();
		this[TILE_UNINDEX] = new Map();
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {CanvasTextureTileRenderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		super.onAdd(layer);
		this.textures = new Map();
		// create handlers
		this[TILE_ADD] = event => {
			this.addTile(this.textures, event.tile);
		};
		this[TILE_REMOVE] = event => {
			this.removeTile(this.textures, event.tile);
		};
		// attach handlers
		this.layer.on(EventType.TILE_ADD, this[TILE_ADD]);
		this.layer.on(EventType.TILE_REMOVE, this[TILE_REMOVE]);
		return this;
	}

	/**
	 * Executed when the layer is removed from a plot.
	 *
	 * @param {Layer} layer - The layer to remove the renderer from.
	 *
	 * @returns {CanvasTextureTileRenderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		this.layer.removeListener(EventType.TILE_ADD, this[TILE_ADD]);
		this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_REMOVE]);
		// delete the handlers
		this[TILE_ADD] = null;
		this[TILE_REMOVE] = null;
		this.textures = null;
		super.onRemove(layer);
		return this;
	}

	/**
	 * Executed when a tile is added to the layer pyramid.
	 *
	 * @param {Map} textures - The texture map.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	/* eslint-disable no-unused-vars */
	addTile(textures, tile) {
		throw '`addTile` must be overridden';
	}

	/**
	 * Executed when a tile is removed from the layer pyramid.
	 *
	 * @param {Map} textures - The texture map.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	removeTile(textures, tile) {
		textures.delete(tile.coord.hash);
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
		this[TILE_INDEX].set(pyramid, index);
		this[TILE_UNINDEX].set(pyramid, unindex);
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
		this.layer.removeListener(EventType.TILE_ADD, this[TILE_INDEX].get(pyramid));
		this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_UNINDEX].get(pyramid));
		// remove handlers
		this[TILE_INDEX].delete(pyramid);
		this[TILE_UNINDEX].delete(pyramid);
	}
}

module.exports = CanvasVertexTileRenderer;
