'use strict';

const EventType = require('../../event/EventType');
const RTreePyramid = require('../../geometry/RTreePyramid');
const Renderer = require('../Renderer');
const TileRenderable = require('./TileRenderable');

// Constants

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
 * Class representing a tile renderer.
 */
class TileRenderer extends Renderer {

	/**
	 * Instantiates a new TileRenderer object.
	 */
	constructor() {
		super();
		this[TILE_INDEX] = new Map();
		this[TILE_UNINDEX] = new Map();
		this.layer = null;
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {TileRenderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		if (!layer) {
			throw 'No layer provided as argument';
		}
		this.layer = layer;
		return this;
	}

	/**
	 * Executed when the layer is removed from a plot.
	 *
	 * @param {Layer} layer - The layer to remove the renderer from.
	 *
	 * @returns {TileRenderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		if (!layer) {
			throw 'No layer provided as argument';
		}
		this.layer = null;
		return this;
	}

	/**
	 * Creates an rtree pyramid object. Creates and attaches the necessary
	 * event handlers to add and remove data from the rtree accordingly.
	 *
	 * @param {object} options - The options for the r-tree pyramid.
	 * @param {number} options.nodeCapacity - The node capacity of the rtree.
	 * @param {Function} options.createCollidables - The function to create collidables from a tile.
	 *
	 * @returns {RTreePyramid} The r-tree pyramid object.
	 */
	createRTreePyramid(options = {}) {
		const createCollidables = options.createCollidables;
		if (!createCollidables) {
			throw '`options.createCollidables` argument is missing';
		}
		// create rtree pyramid
		const pyramid = new RTreePyramid({
			nodeCapacity: options.nodeCapacity
		});
		// create handlers
		const index = event => {
			const tile = event.tile;
			const coord = tile.coord;
			const tileSize = this.layer.plot.tileSize;
			const xOffset = coord.x * tileSize;
			const yOffset = coord.y * tileSize;
			const collidables = createCollidables(tile, xOffset, yOffset);
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
	 * @param {RTreePyramid} pyramid - The r-tree pyramid object to destroy.
	 */
	destroyRTreePyramid(pyramid) {
		// detach handlers
		this.layer.removeListener(EventType.TILE_ADD, this[TILE_INDEX].get(pyramid));
		this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_UNINDEX].get(pyramid));
		// remove handlers
		this[TILE_INDEX].delete(pyramid);
		this[TILE_UNINDEX].delete(pyramid);
	}

	/**
	 * Returns the tile renderables for the underlying layer.
	 *
	 * @returns {Array} The array of tile renderables.
	 */
	getRenderables() {
		const plot = this.layer.plot;
		const pyramid = this.layer.pyramid;
		const tileSize = plot.tileSize;
		const zoom = plot.zoom;
		const viewport = plot.getViewportPixelOffset();
		const coords = plot.getVisibleCoords();
		const renderables = [];
		for (let i=0; i<coords.length; i++) {
			const coord = coords[i];
			const ncoord = coord.normalize();
			// check if we have the tile
			const tile = pyramid.get(ncoord);
			if (tile) {
				const scale = Math.pow(2, zoom - coord.z);
				const renderable = TileRenderable.fromTile(
					tile,
					coord,
					scale,
					tileSize,
					viewport);
				renderables.push(renderable);
			}
		}
		return renderables;
	}

	/**
	 * Returns the tile renderables for the underlying layer at the closest
	 * available level-of-detail.
	 *
	 * @returns {Array} The array of tile renderables.
	 */
	getRenderablesLOD() {
		const plot = this.layer.plot;
		const pyramid = this.layer.pyramid;
		const tileSize = plot.tileSize;
		const zoom = plot.zoom;
		const viewport = plot.getViewportPixelOffset();
		const coords = plot.getVisibleCoords();
		const renderables = [];
		for (let i=0; i<coords.length; i++) {
			const coord = coords[i];
			const ncoord = coord.normalize();
			const scale = Math.pow(2, zoom - coord.z);
			// check if we have any tile LOD available
			const partials = pyramid.getAvailableLOD(ncoord);
			if (partials) {
				for (let j=0; j<partials.length; j++) {
					const partial = partials[j];
					const tile = partial.tile;
					let renderable;
					if (tile.coord.z === coord.z) {
						// exact tile
						renderable = TileRenderable.fromTile(
							tile,
							coord,
							scale,
							tileSize,
							viewport);
					} else if (tile.coord.z < coord.z) {
						// ancestor of the tile
						renderable = TileRenderable.fromAncestorPartial(
							partial,
							coord,
							scale,
							tileSize,
							viewport);
					} else {
						// descendant of the tile
						renderable = TileRenderable.fromDescendantPartial(
							partial,
							coord,
							scale,
							tileSize,
							viewport);
					}
					renderables.push(renderable);
				}
			}
		}
		return renderables;
	}
}

module.exports = TileRenderer;
