'use strict';

const Shader = require('../../webgl/shader/Shader');
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
	 * Executed when the layer is attached to a plot.
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
	 * Executed when the layer is removed from a plot.
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
		return this.layer.plot.getOrthoMatrix();
	}

	/**
	 * Returns the renderables for the underlying layer.
	 *
	 * @returns {Array} The array of renderables.
	 */
	getRenderables() {
		const plot = this.layer.plot;
		const pyramid = this.layer.pyramid;
		const viewport = plot.getViewportPixelOffset();
		// get all currently visible tile coords
		const coords = plot.getVisibleCoords();
		// get available renderables
		const renderables = [];
		coords.forEach(coord => {
			const ncoord = coord.normalize();
			// check if we have the tile
			const tile = pyramid.get(ncoord);
			if (tile) {
				const scale = Math.pow(2, plot.zoom - coord.z);
				const tileOffset = [
					(coord.x * scale * plot.tileSize) - viewport.x,
					(coord.y * scale * plot.tileSize) - viewport.y
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
		const viewport = plot.getViewportPixelOffset();
		// get all currently visible tile coords
		const coords = plot.getVisibleCoords();
		// get available LOD renderables
		const renderables = [];
		coords.forEach(coord => {
			// check if we have any tile LOD available
			const lod = pyramid.getAvailableLOD(coord);
			if (lod) {
				const scale = Math.pow(2, plot.zoom - coord.z);
				const tileOffset = [
					(coord.x * scale * plot.tileSize) - viewport.x,
					(coord.y * scale * plot.tileSize) - viewport.y
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
