'use strict';

const defaultTo = require('lodash/defaultTo');
const Layer = require('../Layer');
const TilePyramid = require('./TilePyramid');

// Private Methods

const requestVisibleTiles = function(layer) {
	// get visible coords
	const coords = layer.plot.getTargetVisibleCoords();
	// request tiles
	layer.requestTiles(coords);
};

/**
 * Class representing a tile-based layer.
 */
class TileLayer extends Layer {

	/**
	 * Instantiates a new TileLayer object.
	 *
	 * @param {Object} options - The layer options.
	 * @param {Renderer} options.renderer - The layer renderer.
	 * @param {Number} options.opacity - The layer opacity.
	 * @param {Number} options.zIndex - The layer z-index.
	 * @param {boolean} options.hidden - Whether or not the layer is visible.
	 * @param {boolean} options.muted - Whether or not the layer is muted.
	 * @param {Number} options.cacheSize - The size of the temporary tile cache.
	 * @param {Number} options.numPersistentLevels - The number of persistent levels in the tile pyramid.
	 */
	constructor(options = {}) {
		super(options);
		this.muted = defaultTo(options.muted, false);
		this.renderer = defaultTo(options.renderer, null);
		this.pyramid = new TilePyramid(this, options);
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Plot} plot - The plot to attach the layer to.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	onAdd(plot) {
		super.onAdd(plot);
		// execute renderer hook
		if (this.renderer) {
			this.renderer.onAdd(this);
		}
		// request tiles if not muted
		if (!this.isMuted()) {
			requestVisibleTiles(this);
		}
		return this;
	}

	/**
	 * Executed when the layer is removed from a plot.
	 *
	 * @param {Plot} plot - The plot to remove the layer from.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	onRemove(plot) {
		// clear the underlying pyramid
		this.pyramid.clear();
		// execute renderer hook
		if (this.renderer) {
			this.renderer.onRemove(this);
		}
		super.onRemove(plot);
		return this;
	}

	/**
	 * Add a renderer to the layer.
	 *
	 * @param {Renderer} renderer - The renderer to add to the layer.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	setRenderer(renderer) {
		if (!renderer) {
			throw 'No renderer argument provided';
		}
		if (this.renderer && this.plot) {
			this.renderer.onRemove(this);
		}
		this.renderer = renderer;
		if (this.plot) {
			this.renderer.onAdd(this);
		}
		return this;
	}

	/**
	 * Remove the renderer from the layer.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	removeRenderer() {
		if (!this.renderer) {
			throw 'No renderer is currently attached to the layer';
		}
		if (this.plot) {
			this.renderer.onRemove(this);
		}
		this.renderer = null;
		return this;
	}

	/**
	 * Returns the renderer of the layer.
	 *
	 * @returns {Renderer} The renderer object.
	 */
	getRenderer() {
		return this.renderer;
	}

	/**
	 * Returns the tile pyramid of the layer.
	 *
	 * @returns {TilePyramid} The tile pyramid object.
	 */
	getPyramid() {
		return this.pyramid;
	}

	/**
	 * Make the layer invisible.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	hide() {
		super.hide();
		return this;
	}

	/**
	 * Mutes the layer, it will no longer send any tile requests.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	mute() {
		this.muted = true;
		return this;
	}

	/**
	 * Unmutes the layer and immediately requests all visible tiles.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	unmute() {
		if (this.isMuted()) {
			this.muted = false;
			if (this.plot) {
				// request visible tiles
				requestVisibleTiles(this);
			}
		}
		return this;
	}

	/**
	 * Returns true if the layer is muted.
	 *
	 * @returns {boolean} Whether or not the layer is muted.
	 */
	isMuted() {
		return this.muted;
	}

	/**
	 * Unmutes and shows the layer.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	enable() {
		this.show();
		this.unmute();
		return this;
	}

	/**
	 * Mutes and hides the layer.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	disable() {
		this.hide();
		this.mute();
		return this;
	}

	/**
	 * Returns true if the layer is disabled (muted and hidden).
	 *
	 * @returns {boolean} Whether or not the layer is disabled.
	 */
	isDisabled() {
		return this.isMuted() && this.isHidden();
	}

	/**
	 * Draw the layer for the frame.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	draw(timestamp) {
		if (this.renderer) {
			this.renderer.draw(timestamp);
		}
		return this;
	}

	/**
	 * Clears any persisted state in the layer.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	clear() {
		super.clear();
		// clear renderer state
		if (this.renderer) {
			this.renderer.clear();
		}
		return this;
	}

	/**
	 * Clear and re-request all tiles for the layer.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	refresh() {
		// clear the underlying pyramid
		this.pyramid.clear();
		// clear layer state
		this.clear();
		// request if attached and not muted
		if (this.plot && !this.isMuted()) {
			// request visible tiles
			requestVisibleTiles(this);
		}
		return this;
	}

	/**
	 * Request a specific tile.
	 *
	 * @param {Coord} coord - The coord of the tile to request.
	 * @param {Function} done - The callback function to execute upon completion.
	 */
	requestTile(coord, done) {
		done(null, null);
	}

	/**
	 * Request an array of tiles.
	 *
	 * @param {Array} coords - The coords of the tiles to request.
	 *
	 * @returns {TileLayer} The layer object, for chaining.
	 */
	requestTiles(coords) {
		if (this.isMuted()) {
			return this;
		}
		this.pyramid.requestTiles(coords);
		return this;
	}

	/**
	 * Pick a position of the layer for a collision with any rendered objects.
	 *
	 * @param {Object} pos - The plot position to pick at.
	 *
	 * @returns {Object} The collision, or null.
	 */
	pick(pos) {
		if (this.renderer) {
			return this.renderer.pick(pos);
		}
		return null;
	}
}

module.exports = TileLayer;
