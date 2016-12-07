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
	 * @param {Array} options.renderers - The layer renderers.
	 * @param {Number} options.opacity - The layer opacity.
	 * @param {boolean} options.hidden - Whether or not the layer is visible.
	 * @param {boolean} options.muted - Whether or not the layer is muted.
	 */
	constructor(options = {}) {
		super();
		if (options.renderer) {
			this.renderers = [ options.renderer ];
		} else {
			this.renderers = defaultTo(options.renderers, []);
		}
		this.opacity = defaultTo(options.opacity, 1.0);
		this.hidden = defaultTo(options.hidden, false);
		this.muted = defaultTo(options.muted, false);
		this.pyramid = new TilePyramid(this, options);
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
		this.plot = plot;
		this.renderers.forEach(renderer => {
			renderer.onAdd(this);
		});
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
		this.renderers.forEach(renderer => {
			renderer.onRemove(this);
		});
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
	addRenderer(renderer) {
		if (!renderer) {
			throw 'No renderer argument provided';
		}
		if (this.renderers.indexOf(renderer) !== -1) {
			throw 'Provided renderer is already attached to the layer';
		}
		this.renderers.push(renderer);
		if (this.plot) {
			renderer.onAdd(this);
		}
		return this;
	}

	/**
	 * Remove a renderer from the layer.
	 *
	 * @param {Renderer} renderer - The rendere to remove from the layer.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	removeRenderer(renderer) {
		if (!renderer) {
			throw 'No renderer argument provided';
		}
		const index = this.renderers.indexOf(renderer);
		if (index === -1) {
			throw 'Provided renderer is not attached to the layer';
		}
		this.renderers.splice(index, 1);
		if (this.plot) {
			renderer.onRemove(this);
		}
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
	}

	/**
	 * Unmutes and shows the layer.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	enable() {
		this.show();
		this.unmute();
	}

	/**
	 * Mutes and hides the layer.
	 *
	 * @returns {Layer} The layer object, for chaining.
	 */
	disable() {
		this.hide();
		this.mute();
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
			return;
		}
		this.renderers.forEach(renderer => {
			renderer.draw(timestamp);
		});
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
		if (!this.muted) {
			this.pyramid.requestTiles(coords);
		}
		return this;
	}
}

module.exports = Layer;
