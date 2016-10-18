'use strict';

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
	 */
	constructor() {
		super();
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
			if (pyramid.has(ncoord)) {
				const scale = Math.pow(2, plot.zoom - coord.z);
				const tileOffset = [
					(coord.x * scale * plot.tileSize) - plot.viewport.x,
					(coord.y * scale * plot.tileSize) - plot.viewport.y
				];
				const renderable = {
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
					coord: coord,
					hash: lod.tile.coord.hash,
					scale: scale,
					uvOffset: [
						lod.offset.x,
						lod.offset.y,
						lod.offset.extent,
						lod.offset.extent
					],
					tileOffset: tileOffset
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
