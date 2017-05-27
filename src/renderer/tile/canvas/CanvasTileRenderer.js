'use strict';

const defaultTo = require('lodash/defaultTo');
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

// Private Methods

const addTile = function(array, tile) {
	const data = tile.data;
	const chunk = array.allocate(tile.coord.hash);
	if (data.width !== undefined && data.height !== undefined) {
		// image
		chunk.ctx.drawImage(data, 0, 0);
	} else {
		// buffer
		const resolution = Math.sqrt(data.length / 4);
		const imageData = chunk.ctx.getImageData(0, 0, resolution, resolution);
		imageData.data.set(new Uint8ClampedArray(data));
		chunk.ctx.putImageData(imageData, 0, 0);
	}
};

const removeTile = function(array, tile) {
	array.delete(tile.coord.hash);
};

/**
 * Class representing a canvas tile renderer.
 */
class CanvasTileRenderer extends TileRenderer {

	/**
	 * Instantiates a new CanvasTileRenderer object.
	 */
	constructor() {
		super();
		this[TILE_ADD] = new Map();
		this[TILE_REMOVE] = new Map();
		this.ctx = null;
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
	 * Creates an image of appropriate size for the layer pyramid using
	 * the provided image size. Creates and attaches the necessary event
	 * handlers to add and remove data from the array accordingly.
	 *
	 * @param {Object} options - The options for the canvas array.
	 * @param {number} options.chunkSize - The dimension of each canvas, in pixels.
	 * @param {Function} options.onAdd - The function executed when a tile is added.
	 * @param {Function} options.onRemove - The function executed when a tile is removed.
	 *
	 * @returns {CanvasArray} The image array object.
	 */
	createCanvasArray(options = {}) {
		// create image array
		const array = new CanvasArray({
			// set num chunks to be able to fit the capacity of the pyramid
			numChunks: this.layer.pyramid.getCapacity(),
			chunkSize: options.chunkSize
		});
		// create handlers
		const onAdd = defaultTo(options.onAdd, addTile);
		const onRemove = defaultTo(options.onRemove, removeTile);
		const add = event => {
			onAdd(array, event.tile);
		};
		const remove = event => {
			onRemove(array, event.tile);
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
	 * Destroys a image array object and removes all event handlers used to
	 * add and remove data from the array.
	 *
	 * @param {CanvasArray} array - The image array to destroy.
	 */
	destroyCanvasArray(array) {
		// detach handlers
		this.layer.removeListener(EventType.TILE_ADD, this[TILE_ADD].get(array));
		this.layer.removeListener(EventType.TILE_REMOVE, this[TILE_REMOVE].get(array));
		// remove handlers
		this[TILE_ADD].delete(array);
		this[TILE_REMOVE].delete(array);
	}

	/**
	 * Renders the provided renderables and their associated images.
	 *
	 * @param {CanvasArray} array - The image array to destroy.
	 */
	drawCanvasRenderables(array) {
		const ctx = this.ctx;
		const layer = this.layer;
		const plot = layer.plot;
		const tileSize = plot.tileSize;
		const renderables = this.getRenderables();
		const viewport = plot.getViewportPixelSize();
		const pixelRatio = plot.pixelRatio;
		const canvasSize = tileSize * pixelRatio;
		// set layer opacity
		ctx.globalAlpha = layer.opacity;
		// draw images
		for (let i=0; i<renderables.length; i++) {
			const renderable = renderables[i].toCanvas(viewport, tileSize);
			const scale = renderable.scale;
			const offset = renderable.tileOffset;
			const image = array.get(renderable.hash).canvas;
			const dstX = offset[0] * pixelRatio;
			const dstY = offset[1] * pixelRatio;
			const dstSize = canvasSize * scale;
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
	 */
	drawCanvasRenderablesLOD(array) {
		const ctx = this.ctx;
		const layer = this.layer;
		const plot = layer.plot;
		const tileSize = plot.tileSize;
		const renderables = this.getRenderablesLOD();
		const viewport = plot.getViewportPixelSize();
		const pixelRatio = plot.pixelRatio;
		const srcCanvasSize = array.chunkSize;
		const dstCanvasSize = tileSize * pixelRatio;
		// set layer opacity
		ctx.globalAlpha = layer.opacity;
		// draw images
		for (let i=0; i<renderables.length; i++) {
			const renderable = renderables[i].toCanvas(viewport, tileSize);
			const scale = renderable.scale;
			const offset = renderable.tileOffset;
			const uvOffset = renderable.uvOffset;
			const image = array.get(renderable.hash).canvas;
			const srcX = uvOffset[0] * srcCanvasSize;
			const srcY = uvOffset[1] * srcCanvasSize;
			const srcSize = uvOffset[2] * srcCanvasSize;
			const dstX = offset[0] * pixelRatio;
			const dstY = offset[1] * pixelRatio;
			const dstSize = dstCanvasSize * scale;
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
