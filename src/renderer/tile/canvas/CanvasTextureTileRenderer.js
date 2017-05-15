'use strict';

const EventType = require('../../../event/EventType');
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
 * Class representing a canvas texture based tile renderer.
 */
class CanvasTextureTileRenderer extends CanvasTileRenderer {

	/**
	 * Instantiates a new CanvasTextureTileRenderer object.
	 *
	 * @param {Object} options - The options object.
	 */
	constructor(options = {}) {
		super(options);
		this.textures = null;
		this[TILE_ADD] = null;
		this[TILE_REMOVE] = null;
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
	addTile(textures, tile) {
		const data = tile.data;
		const canvas = document.createElement('canvas');
		if (data.width !== undefined && data.height !== undefined) {
			// image
			canvas.width = data.width;
			canvas.height = data.height;
			const ctx = canvas.getContext('2d');
			ctx.drawImage(data, 0, 0);
		} else {
			// buffer
			const resolution = Math.sqrt(data.length / 4);
			canvas.width = resolution;
			canvas.height = resolution;
			const ctx = canvas.getContext('2d');
			const imageData = ctx.getImageData(0, 0, resolution, resolution);
			imageData.data.set(data);
			ctx.putImageData(imageData, 0, 0);
		}
		textures.set(tile.coord.hash, canvas);
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
}

module.exports = CanvasTextureTileRenderer;
