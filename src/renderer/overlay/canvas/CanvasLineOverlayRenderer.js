'use strict';

const defaultTo = require('lodash/defaultTo');
const CanvasOverlayRenderer = require('./CanvasOverlayRenderer');

/**
 * Class representing a webgl polyline overlay renderer.
 */
class CanvasLineOverlayRenderer extends CanvasOverlayRenderer {

	/**
	 * Instantiates a new CanvasLineOverlayRenderer object.
	 *
	 * @param {Object} options - The overlay options.
	 * @param {Array} options.lineColor - The color of the line.
	 * @param {number} options.lineWidth - The pixel width of the line.
	 */
	constructor(options = {}) {
		super(options);
		this.lineColor = defaultTo(options.lineColor, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.lineWidth = defaultTo(options.lineWidth, 2);
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {CanvasLineOverlayRenderer} The overlay object, for chaining.
	 */
	draw() {
		const ctx = this.ctx;
		const overlay = this.overlay;
		const plot = overlay.plot;
		const viewport = plot.getViewportPixelSize();
		const cell = plot.cell;
		const pixelRatio = plot.pixelRatio;
		const polylines = overlay.getClippedGeometry();
		const color = this.lineColor;
		const width = this.lineWidth * pixelRatio;
		const scale = Math.pow(2, plot.zoom - cell.zoom);
		const offset = cell.project(plot.viewport, plot.zoom);
		const opacity = overlay.opacity;
		ctx.beginPath();
		for (let i=0; i<polylines.length; i++) {
			const polyline = polylines[i];
			// draw first point
			const first = polyline[0];
			const firstX = first.x * scale - offset.x;
			const firstY = first.y * scale - offset.y;
			const fx = firstX * pixelRatio;
			const fy = (viewport.height - firstY) * pixelRatio;
			ctx.moveTo(fx, fy);
			// then connect remaining
			for (let j=1; j<polyline.length; j++) {
				const point = polyline[j];
				const dstX = point.x * scale - offset.x;
				const dstY = point.y * scale - offset.y;
				const dx = dstX * pixelRatio;
				const dy = (viewport.height - dstY) * pixelRatio;
				ctx.lineTo(dx, dy);
			}
		}
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineWidth = width;
		ctx.strokeStyle = `rgba(
			${Math.floor(color[0]*255)},
			${Math.floor(color[1]*255)},
			${Math.floor(color[2]*255)},
			${color[3] * opacity})`;
		ctx.stroke();
		return this;
	}
}

module.exports = CanvasLineOverlayRenderer;
