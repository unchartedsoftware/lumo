'use strict';

const Shader = require('./shader/Shader');
const Renderer = require('../Renderer');

// Private Methods

const sortByHash = function(a, b) {
	if (a < b) {
		return -1;
	} else if (a > b) {
		return  1;
	}
	return 0;
};

/**
 * Class representing a webgl renderer.
 */
class WebGLRenderer extends Renderer {

	/**
	 * Instantiates a new WebGLRenderer object.
	 *
	 * @param {Object} options - The options object.
	 */
	constructor(options = {}) {
		super(options);
		this.gl = null;
	}

	/**
	 * Executed when the renderer is attached to a layer.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {WebGLRenderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		super.onAdd(layer);
		this.gl = this.layer.plot.gl;
		return this;
	}

	/**
	 * Executed when the renderer is removed from a layer.
	 *
	 * @param {Layer} layer - The layer to remove the renderer from.
	 *
	 * @returns {WebGLRenderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		this.gl = null;
		super.onRemove(layer);
		return this;
	}

	/**
	 * Instantiate and return a new Shader object using the renderers internal
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
		const viewport = this.layer.plot.viewport;
		const left = 0;
		const right = viewport.width;
		const bottom = 0;
		const top = viewport.height;
		const near = -1;
		const far = 1;
		const lr = 1 / (left - right);
		const bt = 1 / (bottom - top);
		const nf = 1 / (near - far);
		const out = new Float32Array(16);
		out[0] = -2 * lr;
		out[1] = 0;
		out[2] = 0;
		out[3] = 0;
		out[4] = 0;
		out[5] = -2 * bt;
		out[6] = 0;
		out[7] = 0;
		out[8] = 0;
		out[9] = 0;
		out[10] = 2 * nf;
		out[11] = 0;
		out[12] = (left + right) * lr;
		out[13] = (top + bottom) * bt;
		out[14] = (far + near) * nf;
		out[15] = 1;
		return out;
	}

	/**
	 * Returns the renderables for the underlying layer.
	 *
	 * @returns {Array} The array of renderables.
	 */
	getRenderables() {
		const plot = this.layer.plot;
		const pyramid = this.layer.pyramid;
		// get all currently visible tile coords
		const coords = plot.viewport.getVisibleCoords(
			plot.tileSize,
			plot.zoom,
			Math.round(plot.zoom), // get tiles closest to current zoom
			plot.wraparound);
		// get available renderables
		const renderables = [];
		coords.forEach(coord => {
			const ncoord = coord.normalize();
			// check if we have the tile
			const tile = pyramid.get(ncoord);
			if (tile) {
				const scale = Math.pow(2, plot.zoom - coord.z);
				const tileOffset = [
					(coord.x * scale * plot.tileSize) - plot.viewport.x,
					(coord.y * scale * plot.tileSize) - plot.viewport.y
				];
				const renderable = {
					tile: tile,
					coord: coord,
					scale: scale,
					hash: ncoord.hash,
					tileOffset: tileOffset
				};
				renderables.push(renderable);
			}
		});
		// sort by hash
		renderables.sort(sortByHash);
		return renderables;
	}

	/**
	 * Returns the renderables for the underlying layer at the closest
	 * available LOD.
	 *
	 * @returns {Array} The array of renderables.
	 */
	getRenderablesLOD() {
		const plot = this.layer.plot;
		const pyramid = this.layer.pyramid;
		// get all currently visible tile coords
		const coords = plot.viewport.getVisibleCoords(
			plot.tileSize,
			plot.zoom,
			Math.round(plot.zoom), // get tiles closest to current zoom
			plot.wraparound);
		// get available LOD renderables
		const renderables = [];
		coords.forEach(coord => {
			// check if we have any tile LOD available
			const lod = pyramid.getAvailableLOD(coord);
			if (lod) {
				const scale = Math.pow(2, plot.zoom - coord.z);
				const tileOffset = [
					(coord.x * scale * plot.tileSize) - plot.viewport.x,
					(coord.y * scale * plot.tileSize) - plot.viewport.y
				];
				const renderable = {
					tile: lod.tile,
					coord: coord,
					scale: scale,
					hash: lod.tile.coord.hash,
					tileOffset: tileOffset,
					uvOffset: [
						lod.offset.x,
						lod.offset.y,
						lod.offset.extent,
						lod.offset.extent
					]
				};
				renderables.push(renderable);
			}
		});
		// sort by hash
		renderables.sort(sortByHash);
		return renderables;
	}
}

module.exports = WebGLRenderer;
