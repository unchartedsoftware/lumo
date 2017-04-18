'use strict';

const Shader = require('../../webgl/shader/Shader');
const Renderer = require('../Renderer');

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
		const tileSize = plot.tileSize;
		const zoom = plot.zoom;
		const viewport = plot.getViewportPixelOffset();
		// get all currently visible tile coords
		const coords = plot.getVisibleCoords();
		// get available renderables
		const renderables = [];
		for (let i=0; i<coords.length; i++) {
			const coord = coords[i];
			const ncoord = coord.normalize();
			// check if we have the tile
			const tile = pyramid.get(ncoord);
			if (tile) {
				const scale = Math.pow(2, zoom - coord.z);
				const tileOffset = [
					(coord.x * scale * tileSize) - viewport.x,
					(coord.y * scale * tileSize) - viewport.y
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
		}
		return renderables;
	}

	/**
	 * Returns the renderables for the underlying layer at the closest
	 * available level-of-detail.
	 *
	 * @returns {Array} The array of renderables.
	 */
	getRenderablesLOD() {
		const plot = this.layer.plot;
		const pyramid = this.layer.pyramid;
		const tileSize = plot.tileSize;
		const zoom = plot.zoom;
		const viewport = plot.getViewportPixelOffset();
		// get all currently visible tile coords
		const coords = plot.getVisibleCoords();
		// get available LOD renderables
		const renderables = [];
		for (let i=0; i<coords.length; i++) {
			const coord = coords[i];
			// check if we have any tile LOD available
			const lods = pyramid.getAvailableLOD(coord);
			if (lods) {
				for (let j=0; j<lods.length; j++) {
					const lod = lods[j];
					const scale = Math.pow(2, zoom - coord.z);
					const tileOffset = [
						((coord.x + lod.offset.x) * scale * tileSize) - viewport.x,
						((coord.y + lod.offset.y) * scale * tileSize) - viewport.y
					];
					const renderable = {
						tile: lod.tile,
						coord: coord,
						scale: scale * lod.offset.scale,
						hash: lod.tile.coord.hash,
						tileOffset: tileOffset,
						uvOffset: lod.uvOffset
					};
					renderables.push(renderable);
				}
			}
		}
		return renderables;
	}
}

module.exports = WebGLRenderer;
