'use strict';

const defaultTo = require('lodash/defaultTo');
const CanvasVertexTileRenderer = require('../CanvasVertexTileRenderer');

/**
 * Class representing a canvas point tile renderer.
 */
class CanvasPointTileRenderer extends CanvasVertexTileRenderer {

	/**
	 * Instantiates a new CanvasPointTileRenderer object.
	 *
	 * @param {Object} options - The options object.
	 * @param {Array} options.color - The color of the points.
	 * @param {Array} options.maxRadius - The maximum radius of the points.
	 */
	constructor(options = {}) {
		super(options);
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.maxRadius = defaultTo(options.maxRadius, 24);
		this.array = null;
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {CanvasPointTileRenderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		super.onAdd(layer);
		const maxRadius = this.maxRadius;
		const tileSize = layer.plot.tileSize;
		this.array = this.createCanvasArray(tileSize + (maxRadius * 2), true);
		return this;
	}

	/**
	 * Executed when the layer is removed from a plot.
	 *
	 * @param {Layer} layer - The layer to remove the renderer from.
	 *
	 * @returns {CanvasPointTileRenderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		this.destroyCanvasArray(this.array);
		this.array = null;
		super.onRemove(layer);
		return this;
	}

	/**
	 * Executed when a tile is added to the layer pyramid.
	 *
	 * @param {CanvasArray} array - The image array object.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	addTile(array, tile) {
		const maxRadius = this.maxRadius;
		const pixelRatio = this.layer.plot.pixelRatio;
		const chunk = array.allocate(tile.coord.hash);
		const canvas = chunk.canvas;
		const ctx = chunk.ctx;
		const color = this.color;
		const points = tile.data;
		const radians = Math.PI * 2.0;
		// set drawing styles
		ctx.globalCompositeOperation = 'lighter';
		ctx.fillStyle = `rgba(
			${Math.floor(color[0]*255)},
			${Math.floor(color[1]*255)},
			${Math.floor(color[2]*255)},
			${color[3]})`;
		// draw points
		for (let i=0; i<points.length; i+=3) {
			const x = points[i] + maxRadius;
			const y = points[i+1] + maxRadius;
			const radius = points[i+2];
			const sx = x * pixelRatio;
			const sy = canvas.height - (y * pixelRatio);
			const sradius = radius * pixelRatio;
			ctx.beginPath();
			ctx.moveTo(sx, sy);
			ctx.arc(sx, sy, sradius, 0, radians);
			ctx.fill();
		}
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {CanvasPointTileRenderer} The renderer object, for chaining.
	 */
	draw() {
		// draw the pre-rendered images
		this.drawCanvasRenderables(this.array, true);
		return this;
	}
}

module.exports = CanvasPointTileRenderer;
