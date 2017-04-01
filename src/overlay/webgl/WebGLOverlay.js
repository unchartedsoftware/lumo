'use strict';

const defaultTo = require('lodash/defaultTo');
const Shader = require('../../render/webgl/shader/Shader');
const EventType = require('../../event/EventType');
const Overlay = require('../Overlay');
const Cell = require('./Cell');

// Constants

/**
 * Pan event handler symbol.
 * @constant {Symbol}
 */
const PAN = Symbol();

/**
 * Zoom event handler symbol.
 * @constant {Symbol}
 */
const ZOOM = Symbol();

/**
 * Class representing an overlay.
 */
class WebGLOverlay extends Overlay {

	/**
	 * Instantiates a new WebGLOverlay object.
	 */
	constructor(options = {}) {
		super(options);
		this.gl = null;
		this.cell = null;
		this.buffers = null;
	}

	/**
	 * Executed when the overlay is attached to a plot.
	 *
	 * @param {Plot} plot - The plot to attach the overlay to.
	 *
	 * @returns {WebGLOverlay} The overlay object, for chaining.
	 */
	onAdd(plot) {
		super.onAdd(plot);
		this.gl = this.plot.gl;
		// generate the buffers
		this.refreshBuffers(true);
		// create refresh handlers
		const pan = () => { this.refreshBuffers(); };
		const zoom = () => { this.refreshBuffers(); };
		this.handlers.set(PAN, pan);
		this.handlers.set(ZOOM, zoom);
		this.plot.on(EventType.PAN, pan);
		this.plot.on(EventType.ZOOM, zoom);
		return this;
	}

	/**
	 * Check if the render cell needs to be refreshed, if so, refresh it.
	 *
	 * @param {boolean} force - Force the refresh.
	 *
	 * @returns {WebGLOverlay} The overlay object, for chaining.
	 */
	refreshBuffers(force = false) {
		if (!this.plot) {
			throw 'Overlay is not attached to a plot';
		}

		// create new cell
		const plot = this.plot;
		const zoom = Math.round(plot.getTargetZoom());
		const centerPx = plot.getTargetCenter();
		const tileSize = plot.tileSize;

		// use rounded target zoom
		const cell = new Cell(zoom, centerPx, tileSize);
		let refresh = false;

		// check if forced or no cell exists
		if (force || !this.cell) {
			refresh = true;
		} else {
			// check if we are outside of one zoom level from last
			const zoomDist = Math.abs(this.cell.zoom - cell.zoom);
			if (zoomDist >= 1) {
				refresh = true;
			} else {
				// check if we are withing buffer distance of the cell bounds
				const cellDist = this.cell.halfSize - this.cell.buffer;
				if (Math.abs(cell.center.x - this.cell.center.x) > cellDist ||
					Math.abs(cell.center.y - this.cell.center.y) > cellDist) {
					refresh = true;
				}
			}
		}

		if (refresh) {
			// generate new buffers
			const buffers = defaultTo(this.createBuffers(cell), []);
			this.buffers = Array.isArray(buffers) ? buffers : [ buffers ];
			// update cell
			this.cell = cell;
		}
	}

	/**
	 * Create and return an array of VertexBuffers.
	 *
	 * @param {Cell} cell - The rendering cell.
	 *
	 * @returns {Array} The array of VertexBuffer objects.
	 */
	createBuffers() {
		throw '`createBuffers` must be overridden';
	}

	/**
	 * Executed when the overlay is removed from a plot.
	 *
	 * @param {Plot} plot - The plot to remove the overlay from.
	 *
	 * @returns {WebGLOverlay} The overlay object, for chaining.
	 */
	onRemove(plot) {
		this.plot.removeListener(EventType.PAN, this.handlers.get(PAN));
		this.plot.removeListener(EventType.ZOOM, this.handlers.get(ZOOM));
		this.handlers.delete(PAN);
		this.handlers.delete(ZOOM);
		this.buffers = null;
		this.gl = null;
		super.onRemove(plot);
		return this;
	}

	/**
	 * Instantiate and return a new Shader object using the overlays internal
	 * WebGLRenderingContext.
	 * @param {Object} params - The shader param object.
	 * @param {String} params.common - Common glsl to be shared by both vertex and fragment shaders.
	 * @param {String} params.vert - The vertex shader glsl.
	 * @param {String} params.frag - The fragment shader glsl.
	 *
	 * @returns {Shader} The shader object.
	 */
	createShader(source) {
		return new Shader(this.gl, source);
	}

	/**
	 * Returns the orthographic projection matrix for the viewport.
	 *
	 * @return {Float32Array} The orthographic projection matrix.
	 */
	getOrthoMatrix() {
		return this.plot.viewport.getOrthoMatrix();
	}

}

module.exports = WebGLOverlay;
