'use strict';

/**
 * Class representing a canvas renderbuffer.
 */
class CanvasRenderBuffer {

	/**
	 * Instantiates a CanvasRenderBuffer object.
	 *
	 * @param {CanvasRenderingContext2D} ctx - The canvas context.
	 * @param {number} width - The width of the renderbuffer.
	 * @param {number} height - The height of the renderbuffer.
	 */
	 constructor(ctx, width, height) {
		this.rootCtx = ctx;
 		this.canvas = document.createElement('canvas');
 		this.canvas.width = width;
 		this.canvas.height = height;
		this.ctx = this.canvas.getContext('2d');
	}

	/**
	 * Returns the rendering context of the renderbuffer.
	 *
	 * @returns {CanvasRenderingContext2D} The context object.
	 */
	getContext() {
		return this.ctx;
	}

	/**
	 * Clears the renderbuffer buffer color bits.
	 *
	 * @returns {CanvasRenderBuffer} The renderbuffer object, for chaining.
	 */
	clear() {
		this.ctx.clearRect(
			0, 0,
			this.canvas.width,
			this.canvas.width);
		return this;
	}

	/**
	 * Blits the renderbuffer texture to the screen.
	 *
	 * @param {number} opacity - The opacity to blit at.
	 *
	 * @returns {CanvasRenderBuffer} The renderbuffer object, for chaining.
	 */
	blitToScreen(opacity) {
		this.rootCtx.globalAlpha = opacity;
		this.rootCtx.drawImage(this.canvas, 0, 0);
		this.rootCtx.globalAlpha = 1.0;
		return this;
	}

	/**
	 * Resizes the renderbuffer to the provided height and width.
	 *
	 * @param {number} width - The new width of the renderbuffer.
	 * @param {number} height - The new height of the renderbuffer.
	 *
	 * @returns {CanvasRenderBuffer} The renderbuffer object, for chaining.
	 */
	resize(width, height) {
 		this.canvas.width = width;
 		this.canvas.height = height;
		return this;
	}
}

module.exports = CanvasRenderBuffer;
