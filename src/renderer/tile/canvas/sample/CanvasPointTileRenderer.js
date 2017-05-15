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
	}

	/**
	 * Executed when a tile is added to the layer pyramid.
	 *
	 * @param {Map} textures - The texture map.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	addTile(textures, tile) {
		const layer = this.layer;
		const maxRadius = this.maxRadius;
		const plot = layer.plot;
		const pixelRatio = plot.pixelRatio;
		const tileSize = plot.tileSize;
		const canvasSize = (tileSize + maxRadius*2);
		const canvas = document.createElement('canvas');
		canvas.width = canvasSize * pixelRatio;
		canvas.height = canvasSize * pixelRatio;
		const ctx = canvas.getContext('2d');
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

		for (let j=0; j<points.length; j+=3) {
			const x = points[j] + maxRadius;
			const y = points[j+1] + maxRadius;
			const radius = points[j+2];
			const sx = x * pixelRatio;
			const sy = (canvasSize - y) * pixelRatio;
			const sradius = radius * pixelRatio;
			ctx.beginPath();
			ctx.moveTo(sx, sy);
			ctx.arc(sx, sy, sradius, 0, radians);
			ctx.fill();
		}
		textures.set(tile.coord.hash, canvas);
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {CanvasPointTileRenderer} The renderer object, for chaining.
	 */
	draw() {
		const ctx = this.ctx;
		const maxRadius = this.maxRadius;
		const layer = this.layer;
		const plot = layer.plot;
		const tileSize = plot.tileSize;
		const renderables = this.getRenderables();
		const viewport = plot.getViewportPixelSize();
		const pixelRatio = plot.pixelRatio;
		const textures = this.textures;

		ctx.globalAlpha = layer.opacity;

		for (let i=0; i<renderables.length; i++) {
			const renderable = renderables[i].toCanvas(viewport, tileSize);
			const scale = renderable.scale;
			const offset = renderable.tileOffset;
			const texture = textures.get(renderable.hash);
			const dstX = (offset[0] - (maxRadius * scale)) * pixelRatio;
			const dstY = (offset[1] - (maxRadius * scale)) * pixelRatio;
			const dstSize = texture.width * scale;
			ctx.drawImage(
				texture,
				dstX,
				dstY,
				dstSize,
				dstSize);
		}

		ctx.globalAlpha = 1.0;

		return this;
	}
}

module.exports = CanvasPointTileRenderer;
