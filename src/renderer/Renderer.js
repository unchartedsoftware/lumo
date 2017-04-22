'use strict';

const EventEmitter = require('events');
const Renderable = require('./Renderable');

/**
 * Class representing a renderer.
 */
class Renderer extends EventEmitter {

	/**
	 * Instantiates a new Renderer object.
	 */
	constructor() {
		super();
		this.layer = null;
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		if (!layer) {
			throw 'No layer provided as argument';
		}
		this.layer = layer;
		return this;
	}

	/**
	 * Executed when the layer is removed from a plot.
	 *
	 * @param {Layer} layer - The layer to remove the renderer from.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		if (!layer) {
			throw 'No layer provided as argument';
		}
		this.layer = null;
		return this;
	}

	/**
	 * Executed when an event occurs on the plot. Return any interpretted events
	 * relating to the renderer.
	 *
	 * @param {Event} type - Th event type to process.
	 * @param {Event} event - The plot-level event to process.
	 *
	 * @returns {Event} The renderer-level event.
	 */
	pick() {
		return null;
	}

	/**
	 * Clears any persisted state in the renderer.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	clear() {
		return this;
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	draw() {
		return this;
	}

	/**
	 * Returns the tile renderables for the underlying layer.
	 *
	 * @returns {Array} The array of tile renderables.
	 */
	getRenderables() {
		const plot = this.layer.plot;
		const pyramid = this.layer.pyramid;
		const tileSize = plot.tileSize;
		const zoom = plot.zoom;
		const viewport = plot.getViewportPixelOffset();
		const coords = plot.getVisibleCoords();
		const renderables = [];
		for (let i=0; i<coords.length; i++) {
			const coord = coords[i];
			const ncoord = coord.normalize();
			// check if we have the tile
			const tile = pyramid.get(ncoord);
			if (tile) {
				const scale = Math.pow(2, zoom - coord.z);
				const renderable = Renderable.fromTile(
					tile,
					coord,
					scale,
					tileSize,
					viewport);
				renderables.push(renderable);
			}
		}
		return renderables;
	}

	/**
	 * Returns the tile renderables for the underlying layer at the closest
	 * available level-of-detail.
	 *
	 * @returns {Array} The array of tile renderables.
	 */
	getRenderablesLOD() {
		const plot = this.layer.plot;
		const pyramid = this.layer.pyramid;
		const tileSize = plot.tileSize;
		const zoom = plot.zoom;
		const viewport = plot.getViewportPixelOffset();
		const coords = plot.getVisibleCoords();
		const renderables = [];
		for (let i=0; i<coords.length; i++) {
			const coord = coords[i];
			const ncoord = coord.normalize();
			const scale = Math.pow(2, zoom - coord.z);
			// check if we have any tile LOD available
			const partials = pyramid.getAvailableLOD(ncoord);
			if (partials) {
				for (let j=0; j<partials.length; j++) {
					const partial = partials[j];
					const tile = partial.tile;
					let renderable;
					if (tile.coord.z === coord.z) {
						// exact tile
						renderable = Renderable.fromTile(
							tile,
							coord,
							scale,
							tileSize,
							viewport);
					} else if (tile.coord.z < coord.z) {
						// ancestor of the tile
						renderable = Renderable.fromAncestorPartial(
							partial,
							coord,
							scale,
							tileSize,
							viewport);
					} else {
						// descendant of the tile
						renderable = Renderable.fromDescendantPartial(
							partial,
							coord,
							scale,
							tileSize,
							viewport);
					}
					renderables.push(renderable);
				}
			}
		}
		return renderables;
	}
}

module.exports = Renderer;
