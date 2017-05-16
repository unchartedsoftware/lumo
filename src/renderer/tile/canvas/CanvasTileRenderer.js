'use strict';

const EventType = require('../../../event/EventType');
const CanvasArray = require('../../../canvas/CanvasArray');
const TileRenderer = require('../TileRenderer');

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
 * Resize handler symbol.
 * @private
 * @constant {Symbol}
 */
const RESIZE = Symbol();

/**
 * Class representing a canvas tile renderer.
 */
class CanvasTileRenderer extends TileRenderer {

	/**
	 * Instantiates a new CanvasTileRenderer object.
	 *
	 * @param {Object} options - The options object.
	 */
	constructor(options = {}) {
		super(options);
		this.ctx = null;
		this[TILE_ADD] = new Map();
		this[TILE_REMOVE] = new Map();
		this[RESIZE] = new Map();
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {CanvasTileRenderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		super.onAdd(layer);
		this.ctx = this.layer.plot.getRenderingContext();
		return this;
	}

	/**
	 * Executed when the layer is removed from a plot.
	 *
	 * @param {Layer} layer - The layer to remove the renderer from.
	 *
	 * @returns {CanvasTileRenderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		this.ctx = null;
		super.onRemove(layer);
		return this;
	}

	/**
	 * Executed when a tile is added to the layer pyramid.
	 *
	 * @param {CanvasArray} array - The canvas array object.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	/* eslint-disable no-unused-vars */
	addTile(array, tile) {
		throw '`addTile` must be overridden';
	}

	/**
	 * Executed when a tile is removed from the layer pyramid.
	 *
	 * @param {CanvasArray} array - The canvas array object.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	removeTile(array, tile) {
		array.delete(tile.coord.hash);
	}

	/**
	 * Creates an image of appropriate size for the layer pyramid using
	 * the provided image size. Creates and attaches the necessary event
	 * handlers to add and remove data from the array accordingly.
	 *
	 * @param {number} pixelSize - The resolution of the images.
	 * @param {bool} scaled - Whether or not the pixel size should be scaled by the pixel ratio.
	 *
	 * @returns {CanvasArray} The image array object.
	 */
	createCanvasArray(pixelSize, scaled) {
		// create image array
		const array = new CanvasArray(
			scaled ? pixelSize * this.layer.plot.pixelRatio : pixelSize,
			{
				// set num chunks to be able to fit the capacity of the pyramid
				numChunks: this.layer.pyramid.getCapacity()
			});
		// create handlers
		const add = event => {
			this.addTile(array, event.tile);
		};
		const remove = event => {
			this.removeTile(array, event.tile);
		};
		const resize = () => {
			const pixelRatio = this.layer.plot.pixelRatio;
			const newPixelSize = scaled ? pixelSize * pixelRatio : pixelSize;
			if (this.array.pixelSize !== newPixelSize) {
				this.array.resize(newPixelSize);
				this.layer.pyramid.forEach(tile => {
					this.addTile(array, tile);
				});
			}
		};
		// attach handlers
		this.layer.on(EventType.TILE_ADD, add);
		this.layer.on(EventType.TILE_REMOVE, remove);
		this.layer.plot.on(EventType.RESIZE, resize);
		// store the handlers under the array
		this[TILE_ADD].set(array, add);
		this[TILE_REMOVE].set(array, remove);
		this[RESIZE].set(array, resize);
		return array;
	}

	/**
	 * Destroys a image array object and removes all event handlers used to
	 * add and remove data from the array.
	 *
	 * @param {CanvasArray} array - The image array to destroy.
	 */
	destroyCanvasArray(array) {
		// detach handlers
		this.layer.plot.removeListener(EventType.RESIZE, this[RESIZE].get(array));
		this.layer.removeListener(EventType.TILE_ADD, this[TILE_ADD].get(array));
		this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_REMOVE].get(array));
		// remove handlers
		this[TILE_ADD].delete(array);
		this[TILE_REMOVE].delete(array);
		this[RESIZE].delete(array);
	}

	/**
	 * Renders the provided renderables and their associated images.
	 *
	 * @param {CanvasArray} array - The image array to destroy.
	 * @param {bool} prescaled - Whether or not the images have already been scaled by pixel ratio.
	 */
	drawCanvasRenderables(array, prescaled = false) {
		const ctx = this.ctx;
		const layer = this.layer;
		const plot = layer.plot;
		const tileSize = plot.tileSize;
		const renderables = this.getRenderables();
		const viewport = plot.getViewportPixelSize();
		const pixelRatio = plot.pixelRatio;
		const scaledTileSize = prescaled ? tileSize * pixelRatio : tileSize;

		// set layer opacity
		ctx.globalAlpha = layer.opacity;
		// draw images
		for (let i=0; i<renderables.length; i++) {
			const renderable = renderables[i].toCanvas(viewport, tileSize);
			const scale = renderable.scale;
			const offset = renderable.tileOffset;
			const image = array.get(renderable.hash).canvas;
			const buffer = (image.width - scaledTileSize) * scale * 0.5;
			const dstX = (offset[0] * pixelRatio) - buffer;
			const dstY = (offset[1] * pixelRatio) - buffer;
			const dstSize = prescaled ? image.width * scale : image.width * scale * pixelRatio;
			ctx.drawImage(
				image,
				dstX,
				dstY,
				dstSize,
				dstSize);
		}
		// reset opacity
		ctx.globalAlpha = 1.0;
	}

	/**
	 * Renders the provided renderables and their associated images based on the
	 * available level-of-detail.
	 *
	 * @param {CanvasArray} array - The image array to destroy.
	 * @param {bool} prescaled - Whether or not the images have already been scaled by pixel ratio.
	 */
	drawCanvasRenderablesLOD(array, prescaled = false) {
		const ctx = this.ctx;
		const layer = this.layer;
		const plot = layer.plot;
		const tileSize = plot.tileSize;
		const renderables = this.getRenderablesLOD();
		const viewport = plot.getViewportPixelSize();
		const pixelRatio = plot.pixelRatio;
		const scaledTileSize = prescaled ? tileSize * pixelRatio : tileSize;
		// set layer opacity
		ctx.globalAlpha = layer.opacity;
		// draw images
		for (let i=0; i<renderables.length; i++) {
			const renderable = renderables[i].toCanvas(viewport, tileSize);
			const scale = renderable.scale;
			const offset = renderable.tileOffset;
			const uvOffset = renderable.uvOffset;
			const image = array.get(renderable.hash).canvas;
			const buffer = (image.width - scaledTileSize) * scale * 0.5;
			const srcX = uvOffset[0] * scaledTileSize;
			const srcY = uvOffset[1] * scaledTileSize;
			const srcSize = uvOffset[2] * scaledTileSize;
			const dstX = (offset[0] * pixelRatio) - buffer;
			const dstY = (offset[1] * pixelRatio) - buffer;
			const dstSize = prescaled ? image.width * scale : image.width * scale * pixelRatio;
			ctx.drawImage(
				image,
				srcX,
				srcY,
				srcSize,
				srcSize,
				dstX,
				dstY,
				dstSize,
				dstSize);
		}
		// reset opacity
		ctx.globalAlpha = 1.0;
	}
}

module.exports = CanvasTileRenderer;
