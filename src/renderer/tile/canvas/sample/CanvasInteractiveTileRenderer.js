'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../../../event/EventType');
const CircleCollidable = require('../../../../geometry/CircleCollidable');
const CanvasVertexTileRenderer = require('../CanvasVertexTileRenderer');

// Constants

/**
 * Zoom start event handler symbol.
 * @private
 * @constant {Symbol}
 */
const ZOOM_START = Symbol();

/**
 * Highlighted point radius increase.
 * @private
 * @constant {number}
 */
const HIGHLIGHTED_RADIUS_OFFSET = 2;

/**
 * Selected point radius increase.
 * @private
 * @constant {number}
 */
const SELECTED_RADIUS_OFFSET = 4;

// Private Methods

const drawPoint = function(ctx, plot, target, color, radiusOffset) {
	const coord = target.tile.coord;
	const scale = Math.pow(2, plot.zoom - coord.z);
	const viewport = plot.getViewportPixelOffset();
	const viewSize = plot.getViewportPixelSize();
	const pixelRatio = plot.pixelRatio;
	const plotX = (((coord.x * plot.tileSize) + target.x) * scale) - viewport.x;
	const plotY = (((coord.y * plot.tileSize) + target.y) * scale) - viewport.y;
	const sx = plotX * pixelRatio;
	const sy = (viewSize.height - plotY) * pixelRatio;
	const sradius = (target.radius + radiusOffset) * pixelRatio;
	ctx.beginPath();
	ctx.moveTo(sx, sy);
	ctx.arc(sx, sy, sradius, 0, Math.PI * 2);
	ctx.globalCompositeOperation = 'lighter';
	ctx.fillStyle = `rgba(
		${Math.floor(color[0]*255)},
		${Math.floor(color[1]*255)},
		${Math.floor(color[2]*255)},
		${color[3]})`;
	ctx.fill();
	ctx.globalCompositeOperation = 'source-over';
};

/**
 * Class representing a canvas interactive point tile renderer.
 */
class CanvasInteractiveTileRenderer extends CanvasVertexTileRenderer {

	/**
	 * Instantiates a new CanvasInteractiveTileRenderer object.
	 *
	 * @param {Object} options - The options object.
	 * @param {Array} options.color - The color of the points.
	 * @param {Array} options.maxRadius - The maximum radius of the points.
	 */
	constructor(options = {}) {
		super(options);
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.maxRadius = defaultTo(options.maxRadius, 24);
		this.array = null;
		this.tree = null;
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {CanvasPointTileRenderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		super.onAdd(layer);
		const maxRadius = this.maxRadius;
		const tileSize = layer.plot.tileSize;
		this.array = this.createCanvasArray(tileSize + (maxRadius * 2), true);
		this.tree = this.createRTreePyramid(32);
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
	 * @returns {CanvasPointTileRenderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		// detach handler
		this.layer.plot.removeListener(EventType.ZOOM_START, this[ZOOM_START]);
		// destroy handler
		this[ZOOM_START] = null;
		this.destroyRTreePyramid(this.tree);
		this.destroyCanvasArray(this.array);
		this.array = null;
		this.tree = null;
		super.onRemove(layer);
		return this;
	}

	/**
	 * Executed when a tile is added to the layer pyramid.
	 *
	 * @param {CanvasArray} array - The image array object.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	addTile(array, tile) {
		const maxRadius = this.maxRadius;
		const pixelRatio = this.layer.plot.pixelRatio;
		const chunk = array.allocate(tile.coord.hash);
		const canvas = chunk.canvas;
		const ctx = chunk.ctx;
		const color = this.color;
		const points = tile.data;
		const radians = Math.PI * 2.0;
		// set drawing styles
		ctx.globalCompositeOperation = 'lighter';
		ctx.fillStyle = `rgba(
			${Math.floor(color[0]*255)},
			${Math.floor(color[1]*255)},
			${Math.floor(color[2]*255)},
			${color[3]})`;
		// draw points
		for (let i=0; i<points.length; i+=3) {
			const x = points[i] + maxRadius;
			const y = points[i+1] + maxRadius;
			const radius = points[i+2];
			const sx = x * pixelRatio;
			const sy = canvas.height - (y * pixelRatio);
			const sradius = radius * pixelRatio;
			ctx.beginPath();
			ctx.moveTo(sx, sy);
			ctx.arc(sx, sy, sradius, 0, radians);
			ctx.fill();
		}
	}

	/**
	 * Given a tile, returns an array of collidable objects. A collidable object
	 * is any object that contains `minX`, `minY`, `maxX`, and `maxY` properties.
	 *
	 * @param {Tile} tile - The tile of data.
	 * @param {number} xOffset - The pixel x offset of the tile.
	 * @param {number} yOffset - The pixel y offset of the tile.
	 */
	createCollidables(tile, xOffset, yOffset) {
		const data = tile.data;
		const collidables = new Array(data.length / 3);
		for (let i=0; i<data.length; i+=3) {
			// add to points
			collidables[i/3] = new CircleCollidable(
				data[i], // x
				data[i+1], // y
				data[i+2], // radius
				xOffset,
				yOffset,
				tile);
		}
		return collidables;
	}

	/**
	 * Pick a position of the renderer for a collision with any rendered objects.
	 *
	 * @param {Object} pos - The plot position to pick at.
	 *
	 * @returns {Object} The collision, if any.
	 */
	pick(pos) {
		if (this.layer.plot.isZooming()) {
			return null;
		}
		return this.tree.searchPoint(
			pos.x,
			pos.y,
			this.layer.plot.zoom,
			this.layer.plot.getPixelExtent());
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {CanvasInteractiveTileRenderer} The renderer object, for chaining.
	 */
	draw() {
		const ctx = this.ctx;
		const layer = this.layer;
		const plot = layer.plot;
		const color = this.color;

		// draw the pre-rendered images
		this.drawCanvasRenderables(this.array, true);

		// set opacity
		ctx.globalAlpha = layer.opacity;

		// render selected
		layer.getSelected().forEach(selected => {
			drawPoint(ctx, plot, selected, color, SELECTED_RADIUS_OFFSET);
		});

		// render highlighted
		const highlighted = layer.getHighlighted();
		if (highlighted && !layer.isSelected(highlighted)) {
			drawPoint(ctx, plot, highlighted, color, HIGHLIGHTED_RADIUS_OFFSET);
		}

		// clear opacity
		ctx.globalAlpha = 1.0;

		return this;
	}
}

module.exports = CanvasInteractiveTileRenderer;
