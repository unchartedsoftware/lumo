'use strict';

const Renderer = require('../Renderer');

// Private Methods

const getRenderables = function(plot, pyramid) {
	// get all currently visible tile coords
	const coords = plot.viewport.getVisibleCoords(
		plot.tileSize,
		plot.zoom,
		Math.round(plot.zoom), // get tiles closest to current zoom
		plot.wraparound);
	// get available renderables
	const renderables = new Map();
	coords.forEach(coord => {
		const ncoord = coord.normalize();
		// check if we have the tile
		const tile = pyramid.get(ncoord);
		if (tile) {
			renderables.set(coord.hash, {
				coord: coord,
				tile: tile
			});
		}
	});
	return renderables;
};

/**
 * Class representing a DOM renderer.
 */
class DOMRenderer extends Renderer {

	/**
	 * Instantiates a new DOMRenderer object.
	 */
	constructor() {
		super();
		this.tiles = null;
	}

	/**
	 * Executed when the renderer is attached to a layer.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {DOMRenderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		super.onAdd(layer);
		this.tiles = new Map();
		this.container = this.createContainer();
		this.layer.plot.container.appendChild(this.container);
		return this;
	}

	/**
	 * Executed when the renderer is removed from a layer.
	 *
	 * @param {Layer} layer - The layer to remove the renderer from.
	 *
	 * @returns {DOMRenderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		this.layer.plot.container.removeChild(this.container);
		this.tiles = null;
		this.container = null;
		super.onRemove(layer);
		return this;
	}

	/**
	 * Create and return the DOM Element which contains the layer.
	 *
	 * @returns {Element} The layer container DOM element.
	 */
	createContainer() {
		throw '`createContainer` not implemented';
	}

	/**
	 * Create and return the DOM Element which represents an individual
	 * tile.
	 *
	 * @param {Number} x - The x position of the tile, in pixels.
	 * @param {Number} y - The y position of the tile, in pixels.
	 * @param {Number} size - the size of the tile, in pixels.
	 *
	 * @returns {Element} The layer container DOM element.
	 */
	createTile() {
		throw '`createTile` not implemented';
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {DOMRenderer} The renderer object, for chaining.
	 */
	draw() {
		const layer = this.layer;
		const pyramid = layer.pyramid;
		const plot = layer.plot;
		const tileSize = plot.tileSize;
		const tiles = this.tiles;
		const container = this.container;

		// update container size
		const px = plot.plotPxToViewPx({ x: 0, y: 0 });
		const scale = Math.pow(2, plot.zoom - Math.round(plot.zoom));
		if (scale === 1) {
			container.style.transform = `translate3d(${px.x}px,${-px.y}px,0)`;
		} else {
			container.style.transform = `translate3d(${px.x}px,${-px.y}px,0) scale(${scale})`;
		}
		// update opacity
		container.style.opacity = layer.opacity;

		// get renderables
		const renderables = getRenderables(plot, pyramid);

		// remove any stale tiles from DOM
		tiles.forEach((tile, hash) => {
			if (!renderables.has(hash)) {
				container.removeChild(tile);
				tiles.delete(hash);
			}
		});

		// add new tiles to the DOM
		renderables.forEach((renderable, hash) => {
			if (!tiles.has(hash)) {
				const tile = this.createTile(
					renderable.coord.x * tileSize,
					renderable.coord.y * tileSize,
					tileSize);
				this.drawTile(tile, renderable.tile);
				container.appendChild(tile);
				tiles.set(hash, tile);
			}
		});
		return this;
	}

	/**
	 * Forces the renderer to discard all current DOM rendered tiles and
	 * recreate them.
	 *
	 * @returns {DOMRenderer} The renderer object, for chaining.
	 */
	redraw() {
		const container = this.container;
		const tiles = this.tiles;
		// remove all tiles
		tiles.forEach((tile, hash) => {
			container.removeChild(tile);
			tiles.delete(hash);
		});
		// force draw
		this.draw();
		return this;
	}

	/**
	 * The draw function that is executed per tile.
	 *
	 * @param {Element} element - The DOM Element object.
	 * @param {Tile} tile - The Tile object.
	 */
	drawTile() {
	}
}

module.exports = DOMRenderer;
