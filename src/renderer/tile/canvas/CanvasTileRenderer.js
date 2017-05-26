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
	 * Creates an image of appropriate size for the layer pyramid using
	 * the provided image size. Creates and attaches the necessary event
	 * handlers to add and remove data from the array accordingly.
	 *
	 * @param {number} pixelSize - The resolution of the images.
	 * @param {bool} scaled - Whether or not the pixel size will be scaled by the pixel ratio.
	 * @param {Function} onAdd - The function executed when a tile is added.
	 * @param {Function} onRemove - The function executed when a tile is removed.
	 *
	 * @returns {CanvasArray} The image array object.
	 */
	createCanvasArray(pixelSize, scaled, onAdd = addTile, onRemove = removeTile) {
		if (!onAdd) {
			throw '`onAdd` function is missing';
		}
		if (!onRemove) {
			throw '`onRemove` function is missing';
		}
		// create image array
		const array = new CanvasArray(
			scaled ? pixelSize * this.layer.plot.pixelRatio : pixelSize,
			{
				// set num chunks to be able to fit the capacity of the pyramid
				numChunks: this.layer.pyramid.getCapacity()
			});
		// create handlers
		const add = event => {
			onAdd(array, event.tile);
		};
		const remove = event => {
			onRemove(array, event.tile);
		};
		const resize = () => {
			const pixelRatio = this.layer.plot.pixelRatio;
			const newPixelSize = scaled ? pixelSize * pixelRatio : pixelSize;
			if (this.array.pixelSize !== newPixelSize) {
				this.array.resize(newPixelSize);
				this.layer.pyramid.forEach(tile => {
					onAdd(array, tile);
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
		let srcCanvasPadding = 0;
		let dstCanvasSize = 0;
		let dstCanvasPadding = 0;
		if (!prescaled) {
			srcCanvasPadding = (array.pixelSize - tileSize) * 0.5;
			dstCanvasSize = array.pixelSize * pixelRatio;
			dstCanvasPadding = srcCanvasPadding * pixelRatio;
		} else {
			srcCanvasPadding = (array.pixelSize - (tileSize * pixelRatio)) * 0.5;
			dstCanvasSize = array.pixelSize;
			dstCanvasPadding = srcCanvasPadding;
		}
		// set layer opacity
		ctx.globalAlpha = layer.opacity;
		// draw images
		for (let i=0; i<renderables.length; i++) {
			const renderable = renderables[i].toCanvas(viewport, tileSize);
			const scale = renderable.scale;
			const offset = renderable.tileOffset;
			const image = array.get(renderable.hash).canvas;
			const dstPadding = dstCanvasPadding * scale;
			const dstX = (offset[0] * pixelRatio) - dstPadding;
			const dstY = (offset[1] * pixelRatio) - dstPadding;
			const dstSize = dstCanvasSize * scale;
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
		let srcCanvasSize = 0;
		let srcCanvasPadding = 0;
		let dstCanvasSize = 0;
		let dstCanvasPadding = 0;
		if (!prescaled) {
			srcCanvasSize = array.pixelSize;
			srcCanvasPadding = (array.pixelSize - tileSize) * 0.5;
			dstCanvasSize = array.pixelSize * pixelRatio;
			dstCanvasPadding = srcCanvasPadding * pixelRatio;
		} else {
			srcCanvasSize = array.pixelSize;
			srcCanvasPadding = (array.pixelSize - (tileSize * pixelRatio)) * 0.5;
			dstCanvasSize = array.pixelSize;
			dstCanvasPadding = srcCanvasPadding;
		}
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
			const dstPadding = dstCanvasPadding * scale;
			const dstX = (offset[0] * pixelRatio) - dstPadding;
			const dstY = (offset[1] * pixelRatio) - dstPadding;
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
