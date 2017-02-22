'use strict';

const DrawEvent = require('../../event/DrawEvent');
const EventType = require('../../event/EventType');
const Renderer = require('../Renderer');

// Constants

/**
 * The maximum left / bottom offset of the container element.
 * @private
 * @constant {Number}
 */
const MAX_CONTAINER_OFFSET = 256*256*8;

/**
 * Draw debounce timeout in milliseconds.
 * @private
 * @constant {Number}
 */
const DRAW_DEBOUNCE_MS = 400;

/**
 * Erase debounce timeout in milliseconds.
 * @private
 * @constant {Number}
 */
const ERASE_DEBOUNCE_MS = 400;

/**
 * Opacity timeout in milleseconds.
 * @private
 * @constant {Number}
 */
const OPACITY_TIMEOUT_MS = 40;

/**
 * Opacity fade in transition duration in milleseconds.
 * @private
 * @constant {Number}
 */
const OPACITY_FADE_IN_MS = 400;

// Private Methods

const getStaleCoords = function(plot, tiles) {
	// get all currently visible tile coords
	const coords = plot.getVisibleCoords();
	const visible = new Map();
	coords.forEach(coord => {
		visible.set(coord.hash, coord);
	});
	// flag any coord that is not in view as stale
	const stale = new Map();
	tiles.forEach((tile, hash) => {
		if (!visible.has(hash)) {
			stale.set(hash, tile);
		}
	});
	return stale;
};

const getRenderables = function(plot, pyramid) {
	// get all currently visible tile coords
	const coords = plot.getVisibleCoords();
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

const drawTiles = function(renderer, container, tiles, plot, pyramid, ignoreFade = false) {
	const tileSize = plot.tileSize;
	// create document fragment
	const fragment = document.createDocumentFragment();
	// add new tiles to the DOM
	const renderables = getRenderables(plot, pyramid);
	renderables.forEach((renderable, hash) => {
		if (!tiles.has(hash)) {
			const coord = renderable.coord;
			// create tile element
			const elem = renderer.createTile(tileSize);
			// position tile
			renderer.positionTile(
				elem,
				coord.x * tileSize + renderer.offset.x,
				coord.y * tileSize + renderer.offset.y,
				tileSize);
			// make tile invisible
			if (!ignoreFade) {
				elem.style.transition = `opacity ${OPACITY_FADE_IN_MS}ms`;
				elem.style.opacity = '0.0';
			}
			// draw the tile
			renderer.drawTile(elem, renderable.tile);
			// add to the fragment
			fragment.append(elem);
			if (!ignoreFade) {
				// fade tile in
				setTimeout(()=>{
					elem.style.opacity = 1.0;
				}, OPACITY_TIMEOUT_MS);
			}
			// add the tile
			tiles.set(hash, {
				coord: coord,
				elem: elem
			});
		}
	});
	if (fragment.children.length > 0) {
		// append all new tiles to the container
		container.appendChild(fragment);
		// emit a postdraw event
		renderer.emit(EventType.POST_DRAW, new DrawEvent(renderables, null));
	}
};

const eraseTiles = function(renderer, container, tiles, plot) {
	// remove any stale tiles from DOM
	const stale = getStaleCoords(plot, tiles);
	stale.forEach((tile, hash) => {
		tiles.delete(hash);
		container.removeChild(tile.elem);
	});
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
		this.container = null;
		// to deal with css top / left precision issues, we need to position
		// the layer container relative to the current viewport within some
		// pixel threshold to prevent rendering issues.
		this.offset = {
			x: 0,
			y: 0
		};
		this.drawTimeout = null;
		this.eraseTimeout = null;
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
		// clear timeouts
		clearTimeout(this.drawTimeout);
		clearTimeout(this.eraseTimeout);
		this.drawTimeout = null;
		this.eraseTimeout = null;
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
	 * @param {Number} size - the size of the tile, in pixels.
	 *
	 * @returns {Element} The tile DOM element.
	 */
	createTile() {
		throw '`createTile` not implemented';
	}

	/**
	 * Set the location of the DOM Element which represents an individual
	 * tile.
	 *
	 * @param {Element} tile - The tile DOM element.
	 * @param {Number} x - The x position of the tile, in pixels.
	 * @param {Number} y - The y position of the tile, in pixels.
	 * @param {Number} size - the size of the tile, in pixels.
	 *
	 * @returns {Element} The tile DOM element.
	 */
	positionTile() {
		throw '`positionTile` not implemented';
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {DOMRenderer} The renderer object, for chaining.
	 */
	draw() {
		const layer = this.layer;
		const plot = layer.plot;
		const tiles = this.tiles;
		const container = this.container;

		// get all stale coords
		const stale = getStaleCoords(plot, tiles);

		if (tiles.size > 0 && stale.size === tiles.size) {
			// all tiles are stale, remove them all
			if (this.eraseTimeout) {
				clearTimeout(this.eraseTimeout);
				this.eraseTimeout = null;
			}
			tiles.clear();
			container.innerHTML = '';
		} else {
			// not all tiles are stale, remove them individually
			if (!this.eraseTimeout) {
				this.eraseTimeout = setTimeout(()=> {
					// clear timeout
					this.eraseTimeout = null;
					// remove any stale tiles from DOM
					eraseTiles(
						this,
						this.container,
						this.tiles,
						this.layer.plot);
				}, ERASE_DEBOUNCE_MS);
			}
		}

		if (!this.drawTimeout) {
			this.drawTimeout = setTimeout(()=> {
				// clear the timeout
				this.drawTimeout = null;
				// draw the renderables
				drawTiles(
					this,
					this.container,
					this.tiles,
					this.layer.plot,
					this.layer.pyramid,
					false);
			}, DRAW_DEBOUNCE_MS);
		}

		// get viewport position
		const px = plot.plotPxToViewPx({ x: 0, y: 0 });

		// determine container offset
		const delta = {
			x: px.x - this.offset.x,
			y: px.y - this.offset.y
		};

		if (Math.abs(delta.x) > MAX_CONTAINER_OFFSET ||
			Math.abs(delta.y) > MAX_CONTAINER_OFFSET) {
			// tile to container offset is too large, reset it to current
			// viewport, re-position all current tiles.
			this.offset.x = px.x;
			this.offset.y = px.y;
			delta.x = 0;
			delta.y = 0;
			const tileSize = plot.tileSize;
			this.tiles.forEach(tile => {
				// re-position tile
				this.positionTile(
					tile.elem,
					tile.coord.x * tileSize + this.offset.x,
					tile.coord.y * tileSize + this.offset.y,
					tileSize);
			});
		}

		// scale on difference between current zoom and rounded target zoom
		const scale = Math.pow(2, plot.zoom - Math.round(plot.getTargetZoom()));

		// update container
		container.style.transform = `translate3d(${delta.x}px,${-delta.y}px,0) scale(${scale})`;
		container.style.transformOrigin = `${this.offset.x}px ${-this.offset.y}px`;
		container.style.opacity = layer.opacity;

		return this;
	}

	/**
	 * Remove all rendered tiles from the DOM.
	 *
	 * @returns {DOMRenderer} The renderer object, for chaining.
	 */
	clear() {
		super.clear();
		// remove all tiles and clear the container
		this.container.innerHTML = '';
		this.tiles.clear();
		// clear timeouts
		clearTimeout(this.drawTimeout);
		clearTimeout(this.eraseTimeout);
		this.drawTimeout = null;
		this.eraseTimeout = null;
		return this;
	}

	/**
	 * Forces the renderer to discard all current DOM rendered tiles and
	 * recreate them.
	 *
	 * @param {Boolean} ignoreFade - Do not fade-in redrawn layer.
	 *
	 * @returns {DOMRenderer} The renderer object, for chaining.
	 */
	redraw(ignoreFade = false) {
		this.clear();
		// force draw
		drawTiles(
			this,
			this.container,
			this.tiles,
			this.layer.plot,
			this.layer.pyramid,
			this.layer,
			ignoreFade);
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
