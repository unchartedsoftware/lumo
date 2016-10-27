'use strict';

const defaultTo = require('lodash/defaultTo');
const rbush = require('rbush');
const EventType = require('../../event/EventType');
const ClickEvent = require('../../event/ClickEvent');
const MouseEvent = require('../../event/MouseEvent');
const WebGLVertexRenderer = require('./WebGLVertexRenderer');

// Constants

/**
 * Click event handler symbol.
 * @private
 * @constant
 */
const CLICK = Symbol();

/**
 * Mousemove event handler symbol.
 * @private
 * @constant
 */
const MOUSE_MOVE = Symbol();

// Private Methods

const getCollision = function(renderer, plotPx) {
	const plot = renderer.layer.plot;
	// points are hashed in un-scaled coordinates, unscale the point
	const targetZoom = Math.round(plot.zoom);
	const scale = Math.pow(2, targetZoom - plot.zoom);
	const unscaledPx = {
		x: plotPx.x * scale,
		y: plotPx.y * scale
	};
	const tree = renderer.trees.get(targetZoom);
	if (!tree) {
		return null;
	}
	const collisions = tree.search({
		minX: unscaledPx.x,
		maxX: unscaledPx.x,
		minY: unscaledPx.y,
		maxY: unscaledPx.y
	});
	if (collisions.length === 0) {
		return null;
	}
	if (!renderer.circularCollision) {
		return collisions[0];
	}
	for (let i=0; i<collisions.length; i++) {
		const collision = collisions[i];
		const dx = (collision.minX + collision.maxX) * 0.5 - unscaledPx.x;
		const dy = (collision.minY + collision.maxY) * 0.5 - unscaledPx.y;
		const radius = collision.radius;
		if ((dx * dx + dy * dy) <= (radius * radius)) {
			return collision;
		}
	}
	return null;
};

const onClick = function(renderer, event) {
	const collision = getCollision(renderer, event.plotPx);
	if (collision) {
		// flag as selected
		renderer.selected = collision;
		renderer.emit(EventType.CLICK, new ClickEvent(
			renderer.layer,
			event.viewPx,
			event.plotPx,
			event.button,
			collision));
	} else {
		// flag as unselected
		renderer.selected = null;
	}
};

const onMouseMove = function(renderer, event) {
	const collision = getCollision(renderer, event.plotPx);
	if (collision) {
		// mimic mouseover / mouseout events
		if (renderer.highlighted) {
			if (renderer.highlighted !== collision) {
				// new collision
				// emit mouseout for prev
				renderer.emit(EventType.MOUSE_OUT, new MouseEvent(
					renderer.layer,
					event.viewPx,
					event.plotPx,
					event.button,
					renderer.highlighted));
				// emit mouseover for new
				renderer.emit(EventType.MOUSE_OVER, new MouseEvent(
					renderer.layer,
					event.viewPx,
					event.plotPx,
					event.button,
					collision));
			}
		} else {
			// no previous collision, execute mouseover
			renderer.emit(EventType.MOUSE_OVER, new MouseEvent(
				renderer.layer,
				event.viewPx,
				event.plotPx,
				event.button,
				collision));
		}
		// flag as highlighted
		renderer.highlighted = collision;
		return;
	}
	// mouse out
	if (renderer.highlighted) {
		renderer.emit(EventType.MOUSE_OUT, new MouseEvent(
			renderer.layer,
			event.viewPx,
			event.plotPx,
			event.button,
			renderer.highlighted));
	}
	// clear highlighted flag
	renderer.highlighted = null;
};

/**
 * Class representing an interactive vertex based webgl renderer.
 */
class WebGLInteractiveRenderer extends WebGLVertexRenderer {

	/**
	 * Instantiates a new WebGLInteractiveRenderer object.
	 *
	 * @param {Object} options - The options object.
	 * @param {boolean} options.circularCollision - Whether to use circular collision instead of box.
	 */
	constructor(options = {}) {
		super(options);
		this.trees = null;
		this.points = null;
		this.highlighted = null;
		this.selected = null;
		this.circularCollision = defaultTo(options.circularCollision, true);
	}

	/**
	 * Executed when the renderer is attached to a layer.
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
		// create handlers
		this.handlers.set(CLICK, event => {
			onClick(this, event);
		});
		this.handlers.set(MOUSE_MOVE, event => {
			onMouseMove(this, event);
		});
		// attach handlers
		layer.plot.on(EventType.CLICK, this.handlers.get(CLICK));
		layer.plot.on(EventType.MOUSE_MOVE, this.handlers.get(MOUSE_MOVE));
		return this;
	}

	/**
	 * Executed when the renderer is removed from a layer.
	 *
	 * @param {Layer} layer - The layer to remove the renderer from.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		// detach handlers
		this.layer.plot.removeListener(EventType.CLICK, this.handlers.get(CLICK));
		this.layer.plot.removeListener(EventType.MOUSE_MOVE, this.handlers.get(MOUSE_MOVE));
		// destroy handlers
		this.handlers.delete(CLICK);
		this.handlers.delete(MOUSE_MOVE);
		// destroy rtree and point maps
		this.trees = null;
		this.points = null;
		// clear selected / highlighted
		this.highlighted = null;
		this.selected = null;
		super.onRemove(layer);
		return this;
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
			this.trees.set(coord.z, rbush());
		}
		this.trees.get(coord.z).load(points);
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
		const tree = this.trees.get(coord.z);
		for (let i=0; i<points.length; i++) {
			tree.remove(points[i]);
		}
		this.points.delete(coord.hash);
		return this;
	}
}

module.exports = WebGLInteractiveRenderer;
