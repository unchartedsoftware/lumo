'use strict';

const rbush = require('rbush');
const EventType = require('../../event/EventType');
const ClickEvent = require('../../event/ClickEvent');
const MouseEvent = require('../../event/MouseEvent');
const WebGLRenderer = require('./WebGLRenderer');

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
	const collisions = renderer.trees.get(targetZoom).search({
		minX: unscaledPx.x,
		maxX: unscaledPx.x,
		minY: unscaledPx.y,
		maxY: unscaledPx.y
	});
	for (let i=0; i<collisions.length; i++) {
		const collision = collisions[i];
		const dx = (collision.minX + collision.maxX) * 0.5 - unscaledPx.x;
		const dy = (collision.minY + collision.maxY) * 0.5 - unscaledPx.y;
		const radius = collision.radius * scale;
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
 * Class representing an interactive webgl renderer.
 */
class WebGLInteractiveRenderer extends WebGLRenderer {

	/**
	 * Instantiates a new WebGLInteractiveRenderer object.
	 */
	constructor() {
		super();
		this.trees = null;
		this.points = null;
		this.highlighted = null;
		this.selected = null;
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

		this.trees = new Map();
		this.points = new Map();

		this.click = event => {
			onClick(this, event);
		};
		this.mousemove = event => {
			onMouseMove(this, event);
		};

		layer.plot.on(EventType.CLICK, this.click);
		layer.plot.on(EventType.MOUSE_MOVE, this.mousemove);

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
		this.layer.plot.removeListener(EventType.CLICK, this.click);
		this.layer.plot.removeListener(EventType.MOUSE_MOVE, this.mousemove);

		this.click = null;
		this.mousemove = null;

		this.trees = null;
		this.points = null;
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
