'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../event/EventType');
const RTree = require('../../collision/RTree');
const CollisionType = require('../../collision/CollisionType');
const WebGLVertexRenderer = require('./WebGLVertexRenderer');

// Constants

/**
 * Zoom start event handler symbol.
 * @private
 * @constant {Symbol}
 */
const ZOOM_START = Symbol();

// Private Methods

const getCollision = function(renderer, pos) {
	const plot = renderer.layer.plot;
	// don't return collision if zooming
	if (plot.isZooming()) {
		return null;
	}
	// points are hashed in un-scaled coordinates, unscale the point
	const tileZoom = Math.round(plot.zoom);
	// get the tree for the zoom
	const tree = renderer.trees.get(tileZoom);
	if (!tree) {
		// no data for tile
		return null;
	}
	const scale = Math.pow(2, tileZoom - plot.zoom);
	const extent = plot.getPixelExtent();
	// unscaled points
	const sx = pos.x * extent * scale;
	const sy = pos.y * extent * scale;
	return tree.searchPoint(sx, sy);
};

/**
 * Class representing an interactive vertex based webgl renderer.
 */
class WebGLInteractiveRenderer extends WebGLVertexRenderer {

	/**
	 * Instantiates a new WebGLInteractiveRenderer object.
	 *
	 * @param {Object} options - The options object.
	 * @param {boolean} options.collisionType - The collision type of the points.
	 * @param {boolean} options.nodeCapacity - The node capacity of the r-tree.
	 */
	constructor(options = {}) {
		super(options);
		this.trees = null;
		this.points = null;
		this.collisionType = defaultTo(options.collisionType, CollisionType.CIRCLE);
		this.nodeCapacity = defaultTo(options.nodeCapacity, 32);
		this[ZOOM_START] = null;
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		super.onAdd(layer);
		// create rtree and point maps
		this.trees = new Map();
		this.points = new Map();
		// create handler
		this[ZOOM_START] = () => {
			// clear on zoom since we won't be able to match the same data
			this.layer.clear();
		};
		// attach handler
		layer.plot.on(EventType.ZOOM_START, this[ZOOM_START]);
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
		// detach handler
		this.layer.plot.removeListener(EventType.ZOOM_START, this[ZOOM_START]);
		// destroy handler
		this[ZOOM_START] = null;
		// destroy rtree and point maps
		this.trees = null;
		this.points = null;
		super.onRemove(layer);
		return this;
	}

	/**
	 * Pick a position of the renderer for a collision with any rendered objects.
	 *
	 * @param {Object} pos - The plot position to pick at.
	 *
	 * @returns {Object} The collision, if any.
	 */
	pick(pos) {
		return getCollision(this, pos);
	}

	/**
	 * Indexes the provided points into an R-Tree structure.
	 *
	 * @param {Coord} coord - The coord for the tile.
	 * @param {Array} points - The point data to index.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	addPoints(coord, points) {
		if (!this.trees.has(coord.z)) {
			this.trees.set(coord.z, new RTree({
				collisionType: this.collisionType,
				nodeCapacity: this.nodeCapacity
			}));
		}
		this.trees.get(coord.z).insert(points);
		this.points.set(coord.hash, points);
		return this;
	}

	/**
	 * Removes the coords worth of tiles from the R-Tree structure.
	 *
	 * @param {Coord} coord - The coord for the tile.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	removePoints(coord) {
		const points = this.points.get(coord.hash);
		this.trees.get(coord.z).remove(points);
		this.points.delete(coord.hash);
		return this;
	}
}

module.exports = WebGLInteractiveRenderer;
