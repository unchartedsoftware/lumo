'use strict';

const defaultTo = require('lodash/defaultTo');
const CanvasOverlayRenderer = require('./CanvasOverlayRenderer');

/**
 * Class representing a webgl point overlay renderer.
 */
class CanvasPointOverlayRenderer extends CanvasOverlayRenderer {

	/**
	 * Instantiates a new CanvasPointOverlayRenderer object.
	 *
	 * @param {Object} options - The overlay options.
	 * @param {Array} options.pointColor - The color of the points.
	 * @param {number} options.pointRadius - The pixel radius of the points.
	 */
	constructor(options = {}) {
		super(options);
		this.pointColor = defaultTo(options.pointColor, [ 1.0, 0.0, 1.0, 1.0 ]);
		this.pointRadius = defaultTo(options.pointRadius, 4);
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {CanvasPointOverlayRenderer} The overlay object, for chaining.
	 */
	draw() {
		const ctx = this.ctx;
		const overlay = this.overlay;
		const plot = overlay.plot;
		const viewport = plot.getViewportPixelSize();
		const cell = plot.cell;
		const pixelRatio = plot.pixelRatio;
		const points = overlay.getClippedGeometry();
		const color = this.pointColor;
		const radius = this.pointRadius * pixelRatio;
		const radians = Math.PI * 2.0;
		const scale = Math.pow(2, plot.zoom - cell.zoom);
		const offset = cell.project(plot.viewport, plot.zoom);
		const opacity = overlay.opacity;
		ctx.beginPath();
		for (let i=0; i<points.length; i++) {
			const point = points[i];
			const x = point.x * scale - offset.x;
			const y = point.y * scale - offset.y;
			const sx = x * pixelRatio;
			const sy = (viewport.height - y) * pixelRatio;
			ctx.moveTo(sx, sy);
			ctx.arc(sx, sy, radius, 0, radians);
		}
		ctx.fillStyle = `rgba(
			${Math.floor(color[0]*255)},
			${Math.floor(color[1]*255)},
			${Math.floor(color[2]*255)},
			${color[3] * opacity})`;
		ctx.fill();
		return this;
	}
}

module.exports = CanvasPointOverlayRenderer;
