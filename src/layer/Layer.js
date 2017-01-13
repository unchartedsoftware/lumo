'use strict';

const defaultTo = require('lodash/defaultTo');
const EventEmitter = require('events');
const Request = require('../plot/Request');
const EventType = require('../event/EventType');
const LayerEvent = require('../event/LayerEvent');
const TilePyramid = require('./TilePyramid');

/**
 * Class representing an individual layer.
 */
class Layer extends EventEmitter {

	/**
	 * Instantiates a new Layer object.
	 *
	 * @param {Object} options - The layer options.
	 * @param {Renderer} options.renderer - The layer renderer.
	 * @param {Number} options.opacity - The layer opacity.
	 * @param {boolean} options.hidden - Whether or not the layer is visible.
	 * @param {boolean} options.muted - Whether or not the layer is muted.
	 */
	constructor(options = {}) {
		super();
		this.opacity = defaultTo(options.opacity, 1.0);
		this.hidden = defaultTo(options.hidden, false);
		this.muted = defaultTo(options.muted, false);
		this.pyramid = new TilePyramid(this, options);
		this.renderer = defaultTo(options.renderer, null);
		this.plot = null;
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Plot} plot - The plot to attach the layer to.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	onAdd(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		// set plot
		this.plot = plot;
		// execute renderer hook
		if (this.renderer) {
			this.renderer.onAdd(this);
		}
		// request initial tiles.
		this.refresh();
		// emit on add
		this.emit(EventType.ON_ADD, new LayerEvent(this));
		return this;
	}

	/**
	 * Executed when the layer is removed from a plot.
	 *
	 * @param {Plot} plot - The plot to remove the layer from.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	onRemove(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		// execute renderer hook
		if (this.renderer) {
			this.renderer.onRemove(this);
		}
		// remove plot
		this.plot = null;
		// clear the underlying pyramid
		this.pyramid.clear();
		// emit on remove
		this.emit(EventType.ON_REMOVE, new LayerEvent(this));
		return this;
	}

	/**
	 * Add a renderer to the layer.
	 *
	 * @param {Renderer} renderer - The renderer to add to the layer.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	setRenderer(renderer) {
		this.renderer = renderer;
		return this;
	}

	/**
	 * Remove the renderer from the layer.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	removeRenderer() {
		if (!this.renderer) {
			throw 'No renderer is currently attached to the layer';
		}
		this.renderer = null;
		return this;
	}

	/**
	 * Make the layer visible.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	show() {
		this.hidden = false;
		return this;
	}

	/**
	 * Make the layer invisible.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	hide() {
		this.hidden = true;
		return this;
	}

	/**
	 * Returns true if the layer is hidden.
	 *
	 * @returns {boolean} Whether or not the layer is hidden.
	 */
	isHidden() {
		return this.hidden;
	}

	/**
	 * Mutes the layer, it will no longer send any tile requests.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	mute() {
		this.muted = true;
		return this;
	}

	/**
	 * Unmutes the layer and immediately requests all visible tiles.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	unmute() {
		if (this.muted) {
			this.muted = false;
			if (this.plot) {
				// request tiles
				Request.requestTiles(this.plot);
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
	 * @returns {Layer} The layer object, for chaining.
	 */
	enable() {
		this.show();
		this.unmute();
		return this;
	}

	/**
	 * Mutes and hides the layer.
	 *
	 * @returns {Layer} The layer object, for chaining.
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
		return this.muted && this.hidden;
	}

	/**
	 * Draw the layer for the frame.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	draw(timestamp) {
		if (this.hidden) {
			if (this.renderer && this.renderer.clear) {
				// clear DOM based renderer
				this.renderer.clear();
			}
			return this;
		}
		if (this.renderer) {
			this.renderer.draw(timestamp);
		}
		return this;
	}

	/**
	 * Clear and re-request all tiles for the layer.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	refresh() {
		// clear the underlying pyramid
		this.pyramid.clear();
		// request base tile, this ensures we at least have the lowest LOD
		Request.requestBaseTile(this);
		// check if we are currently zooming
		const animation = this.plot.zoomAnimation;
		if (animation) {
			// initiate a zoom request
			Request.zoomRequest(this.plot, animation.targetViewport, animation.targetZoom);
		} else {
			// request tiles for current viewport
			Request.requestTiles(this.plot);
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
	 * @returns {Layer} The layer object, for chaining.
	 */
	requestTiles(coords) {
		if (this.muted) {
			return this;
		}
		this.pyramid.requestTiles(coords);
		return this;
	}
}

module.exports = Layer;
