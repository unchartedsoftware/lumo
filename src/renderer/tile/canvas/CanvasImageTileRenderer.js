'use strict';

const CanvasTextureTileRenderer = require('./CanvasTextureTileRenderer');

/**
 * Class representing a canvas image tile renderer.
 */
class CanvasImageTileRenderer extends CanvasTextureTileRenderer {

	/**
	 * Instantiates a new CanvasImageTileRenderer object.
	 *
	 * @param {Object} options - The options object.
	 */
	constructor(options = {}) {
		super(options);
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {CanvasImageTileRenderer} The renderer object, for chaining.
	 */
	draw() {
		const ctx = this.ctx;
		const layer = this.layer;
		const plot = layer.plot;
		const tileSize = plot.tileSize;
		const renderables = this.getRenderablesLOD();
		const viewport = plot.getViewportPixelSize();
		const pixelRatio = plot.pixelRatio;
		const textures = this.textures;

		ctx.globalAlpha = layer.opacity;

		for (let i=0; i<renderables.length; i++) {
			const renderable = renderables[i].toCanvas(viewport, tileSize);
			const scale = renderable.scale;
			const offset = renderable.tileOffset;
			const uvOffset = renderable.uvOffset;
			const texture = textures.get(renderable.hash);
			const srcX = uvOffset[0] * tileSize;
			const srcY = uvOffset[1] * tileSize;
			const srcSize = uvOffset[2] * tileSize;
			const dstX = offset[0] * pixelRatio;
			const dstY = offset[1] * pixelRatio;
			const dstSize = texture.width * scale * pixelRatio;
			ctx.drawImage(
				texture,
				srcX,
				srcY,
				srcSize,
				srcSize,
				dstX,
				dstY,
				dstSize,
				dstSize);
		}

		ctx.globalAlpha = 1.0;

		return this;
	}
}

module.exports = CanvasImageTileRenderer;
