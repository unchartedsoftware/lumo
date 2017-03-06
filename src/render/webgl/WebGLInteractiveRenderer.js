'use strict';

const defaultTo = require('lodash/defaultTo');
const Keyboard = require('../../core/Keyboard');
const EventType = require('../../event/EventType');
const ClickEvent = require('../../event/ClickEvent');
const MouseEvent = require('../../event/MouseEvent');
const RTree = require('./rtree/RTree');
const CollisionType = require('./rtree/CollisionType');
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

/**
 * Zoom end event handler symbol.
 * @private
 * @constant
 */
const ZOOM_START = Symbol();

// Private Methods

const getCollision = function(renderer, plotPx) {
	const plot = renderer.layer.plot;
	// don't return collision if zooming
	if (plot.isZooming()) {
		return null;
	}
	// points are hashed in un-scaled coordinates, unscale the point
	const targetZoom = Math.round(plot.zoom);
	const scale = Math.pow(2, targetZoom - plot.zoom);
	// unscaled points
	const sx = plotPx.x * scale;
	const sy = plotPx.y * scale;
	// get the tree for the zoom
	const tree = renderer.trees.get(targetZoom);
	if (!tree) {
		// no data for tile
		return null;
	}
	return tree.searchPoint(sx, sy);
};

const onClick = function(renderer, event) {
	const multiSelect = Keyboard.poll('ctrl') || Keyboard.poll('meta');
	const collision = getCollision(renderer, event.plotPx);
	if (collision) {
		// add to collection if multi-selection is enabled
		if (multiSelect) {
			// add to collection if multi-selection is enabled
			const index = renderer.selected.indexOf(collision);
			if (index === -1) {
				// select point
				renderer.selected.push(collision);
			} else {
				// remove point if already selected
				renderer.selected.splice(index, 1);
			}
		} else {
			// clear selection, adding only the latest entry
			renderer.selected = [ collision ];
		}
		// emit click event
		renderer.emit(EventType.CLICK, new ClickEvent(
			renderer.layer,
			event.viewPx,
			event.plotPx,
			event.button,
			renderer.selected.length > 1 ? renderer.selected : collision));
	} else {
		if (multiSelect) {
			// if multi-select is held, don't clear selection, it implies user
			// may have misclicked
			return;
		}
		// flag as unselected
		renderer.selected = [];
	}
};

const active = new Map();
const setCursor = function(renderer) {
	const plot = renderer.layer.plot;
	if (!active.has(plot)) {
		active.set(plot, new Map());
	}
	const isActive = active.get(plot);
	if (!isActive.has(renderer)) {
		isActive.set(renderer, true);
		plot.getContainer().style.cursor = 'pointer';
	};
};

const resetCursor = function(renderer) {
	const plot = renderer.layer.plot;
	if (!active.has(plot)) {
		return;
	}
	const isActive = active.get(plot);
	isActive.delete(renderer);
	if (isActive.size === 0) {
		plot.getContainer().style.cursor = 'inherit';
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
		// set cursor
		setCursor(renderer);
		// flag as highlighted
		renderer.highlighted = collision;
		return;
	}
	// mouse out
	if (renderer.highlighted) {
		// reset cursor
		resetCursor(renderer);
		// emit mouse out
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
	 * @param {boolean} options.collisionType - The collision type of the points.
	 * @param {boolean} options.nodeCapacity - The node capacity of the r-tree.
	 */
	constructor(options = {}) {
		super(options);
		this.trees = null;
		this.points = null;
		this.highlighted = null;
		this.selected = [];
		this.collisionType = defaultTo(options.collisionType, CollisionType.CIRCLE);
		this.nodeCapacity = defaultTo(options.nodeCapacity, 32);
	}

	/**
	 * Clears any selection / highlighted elements.
	 *
	 * @returns {WebGLVertexRenderer} The renderer object, for chaining.
	 */
	clear() {
		super.clear();
		// clear selected / highlighted
		this.highlighted = null;
		this.selected = [];
		// reset the cursor
		resetCursor(this);
		return this;
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
			if (this.layer.isHidden()) {
				return;
			}
			onClick(this, event);
		});
		this.handlers.set(MOUSE_MOVE, event => {
			if (this.layer.isHidden()) {
				return;
			}
			onMouseMove(this, event);
		});
		this.handlers.set(ZOOM_START, () => {
			this.selected = [];
			this.highlighted = null;
		});
		// attach handlers
		layer.plot.on(EventType.CLICK, this.handlers.get(CLICK));
		layer.plot.on(EventType.MOUSE_MOVE, this.handlers.get(MOUSE_MOVE));
		layer.plot.on(EventType.ZOOM_START, this.handlers.get(ZOOM_START));
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
		this.layer.plot.removeListener(EventType.ZOOM_START, this.handlers.get(ZOOM_START));
		// destroy handlers
		this.handlers.delete(CLICK);
		this.handlers.delete(MOUSE_MOVE);
		this.handlers.delete(ZOOM_START);
		// destroy rtree and point maps
		this.trees = null;
		this.points = null;
		this.selected = [];
		this.highlighted = null;
		// clear selected / highlighted
		this.clear();
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
