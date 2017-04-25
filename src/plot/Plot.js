'use strict';

const clamp = require('lodash/clamp');
const defaultTo = require('lodash/defaultTo');
const throttle = require('lodash/throttle');
const EventEmitter = require('events');
const EventType = require('../event/EventType');
const EventBroadcaster = require('../event/EventBroadcaster');
const EventDelegator = require('../event/EventDelegator');
const Event = require('../event/Event');
const ResizeEvent = require('../event/ResizeEvent');
const RenderBuffer = require('../webgl/texture/RenderBuffer');
const Viewport = require('./Viewport');
const Cell = require('./Cell');
const ClickHandler = require('./handler/ClickHandler');
const MouseHandler = require('./handler/MouseHandler');
const PanHandler = require('./handler/PanHandler');
const ZoomHandler = require('./handler/ZoomHandler');

// Constants

/**
 * Pan request throttle in milliseconds.
 * @private
 * @constant {Number}
 */
const PAN_THROTTLE_MS = 100;

/**
 * Resize request throttle in milliseconds.
 * @private
 * @constant {Number}
 */
const RESIZE_THROTTLE_MS = 200;

/**
 * Zoom request throttle in milliseconds.
 * @private
 * @constant {Number}
 */
const ZOOM_THROTTLE_MS = 400;

/**
 * The maximum zoom delta until a cell update event.
 * @private
 * @constant {Number}
 */
const CELL_ZOOM_DELTA = 1.0;

/**
 * The maximum zoom level supported.
 * @private
 * @constant {Number}
 */
const MAX_ZOOM = 24;

/**
 * Click handler symbol.
 * @private
 * @constant {Symbol}
 */
const CLICK = Symbol();

/**
 * Mouse handler symbol.
 * @private
 * @constant {Symbol}
 */
const MOUSE = Symbol();

/**
 * Pan handler symbol.
 * @private
 * @constant {Symbol}
 */
const PAN = Symbol();

/**
 * Zoom handler symbol.
 * @private
 * @constant {Symbol}
 */
const ZOOM = Symbol();

/**
 * Event handlers symbol.
 * @private
 * @constant {Symbol}
 */
const HANDLERS = Symbol();

/**
 * Event delegators symbol.
 * @private
 * @constant {Symbol}
 */
const DELEGATOR = Symbol();

/**
 * Event broadcasters symbol.
 * @private
 * @constant {Symbol}
 */
const BROADCASTER = Symbol();

/**
 * Dirty plot symbol.
 * @private
 * @constant {Symbol}
 */
const DIRTY = Symbol();

// Private Methods

const requestTiles = function() {
	// get all visible coords in the target viewport
	const coords = this.getTargetVisibleCoords();
	// for each layer
	this.layers.forEach(layer => {
		if (layer.requestTiles) {
			// request tiles
			layer.requestTiles(coords);
		}
	});
	return this;
};

const resize = function(plot) {
	const current = {
		width: plot.container.offsetWidth,
		height: plot.container.offsetHeight
	};
	const prev = plot.getViewportPixelSize();
	const center = plot.viewport.getCenter();

	if (prev.width !== current.width ||
		prev.height !== current.height ||
		plot.pixelRatio !== window.devicePixelRatio) {
		// store device pixel ratio
		plot.pixelRatio = window.devicePixelRatio;
		// resize canvas
		plot.canvas.style.width = current.width + 'px';
		plot.canvas.style.height = current.height + 'px';
		plot.canvas.width = current.width * plot.pixelRatio;
		plot.canvas.height = current.height * plot.pixelRatio;
		// resize render target
		plot.renderBuffer.resize(
			current.width * plot.pixelRatio,
			current.height * plot.pixelRatio);
		// update viewport
		const extent = plot.getPixelExtent();
		plot.viewport.width = current.width / extent;
		plot.viewport.height = current.height / extent;
		// re-center viewport
		plot.viewport.centerOn(center);
		// request tiles
		plot.resizeRequest();
		// emit resize
		plot.setDirty();
		plot.emit(EventType.RESIZE, new ResizeEvent(plot, prev, current));
	}
};

const updateCell = function(plot) {
	const zoom = plot.getTargetZoom();
	const center = plot.getTargetViewportCenter();
	const extent = plot.getTargetPixelExtent();
	const size = plot.getViewportPixelSize();
	const cell = new Cell(zoom, center, extent);

	let refresh = false;
	// check if forced or no cell exists
	if (!plot.cell) {
		refresh = true;
	} else {
		// check if we are outside of one zoom level from last
		const zoomDist = Math.abs(plot.cell.zoom - cell.zoom);
		if (zoomDist >= CELL_ZOOM_DELTA) {
			refresh = true;
		} else {
			// check if we are withing buffer distance of the cell bounds
			const xDist = plot.cell.halfSize - (size.width / plot.cell.extent);
			const yDist = plot.cell.halfSize - (size.height / plot.cell.extent);
			if (Math.abs(cell.center.x - plot.cell.center.x) > xDist ||
				Math.abs(cell.center.y - plot.cell.center.y) > yDist) {
				refresh = true;
			}
		}
	}
	if (refresh) {
		// update cell
		plot.cell = cell;
		// emit cell refresh
		plot.emit(EventType.CELL_UPDATE, new Event(cell));
	}
};

const reset = function(plot) {
	if (!plot.wraparound) {
		// if there is no wraparound, do not reset
		return;
	}

	// resets the position of the viewport relative to the plot such that
	// the plot native coordinate range is within the viewports bounds.

	// get viewport width in plot coords
	const width = Math.ceil(plot.viewport.width / 1.0);

	// past the left bound of the viewport
	if (plot.viewport.x > 1.0) {
		plot.viewport.x -= width;
		if (plot.isPanning()) {
			plot.panAnimation.start.x -= width;
		}
	}
	// past the right bound of the viewport
	if (plot.viewport.x + plot.viewport.width < 0) {
		plot.viewport.x += width;
		if (plot.isPanning()) {
			plot.panAnimation.start.x += width;
		}
	}
};

const frame = function(plot) {

	// get frame timestamp
	const timestamp = Date.now();

	// emit frame event
	plot.emit(EventType.FRAME, new Event(plot, timestamp));

	// update size
	resize(plot);

	if (!plot.dirtyChecking || plot.isDirty()) {

		// clear flag now, this way layers that may be animating can signal
		// that the animation is not complete by flagging as dirty during the
		// draw call.
		plot.clearDirty();

		// apply the zoom animation
		if (plot.isZooming()) {
			if (plot.zoomAnimation.update(timestamp)) {
				plot.zoomAnimation = null;
			}
		}

		// apply the pan animation
		if (plot.isPanning()) {
			if (plot.panAnimation.update(timestamp)) {
				plot.panAnimation = null;
			}
			plot.panRequest();
		}

		// reset viewport / plot
		reset(plot);

		// update cell
		updateCell(plot);

		// context shorthand
		const gl = plot.gl;

		// clear the backbuffer
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		// set the viewport
		const size = plot.getViewportPixelSize();
		gl.viewport(
			0, 0,
			size.width * plot.pixelRatio,
			size.height * plot.pixelRatio);

		// sort layers by z-index
		const layers = plot.getSortedLayers();

		// render each layer
		layers.forEach(layer => {
			if (!layer.isHidden()) {
				layer.draw(timestamp);
			}
		});
	}

	// request next frame
	plot.frameRequest = requestAnimationFrame(() => {
		frame(plot);
	});
};

/**
 * Class representing a plot.
 */
class Plot extends EventEmitter {

	/**
	 * Instantiates a new Plot object.
	 *
	 * @param {String} selector - The selector for the canvas element.
	 * @param {Object} options - The plot options.
	 * @param {Number} options.tileSize - The dimension in pixels of a tile.
	 * @param {Number} options.zoom - The zoom of the plot.
	 * @param {Number} options.minZoom - The minimum zoom of the plot.
	 * @param {Number} options.maxZoom - The maximum zoom of the plot.
	 * @param {Object} options.center - The center of the plot, in plot pixels.
	 * @param {boolean} options.wraparound - Whether or not the plot wraps around.
	 * @param {boolean} options.dirtyChecking - Whether or not the plot uses dirty checking or renders every frame.
	 *
	 * @param {Number} options.panThrottle - Pan request throttle timeout in ms.
	 * @param {Number} options.resizeThrottle - Resize request throttle timeout in ms.
	 * @param {Number} options.zoomThrottle - Zoom request throttle timeout in ms.
	 *
	 * @param {Number} options.inertia - Whether or not pan inertia is enabled.
	 * @param {Number} options.inertiaEasing - The inertia easing factor.
	 * @param {Number} options.inertiaDeceleration - The inertia deceleration factor.
	 *
	 * @param {Number} options.continuousZoom - Whether or not continuous zoom is enabled.
	 * @param {Number} options.zoomDuration - The duration of the zoom animation.
	 * @param {Number} options.maxConcurrentZooms - The maximum concurrent zooms in a single batch.
	 * @param {Number} options.deltaPerZoom - The scroll delta required per zoom level.
	 * @param {Number} options.zoomDebounce - The debounce duration of the zoom in ms.
	 */
	constructor(selector, options = {}) {
		super();
		this.container = document.querySelector(selector);
		if (!this.container) {
			throw `Element could not be found for selector ${selector}`;
		}

		// create canvas element
		this.canvas = document.createElement('canvas');
		this.canvas.style.width = this.container.offsetWidth + 'px';
		this.canvas.style.height = this.container.offsetHeight + 'px';
		this.canvas.width = this.container.offsetWidth * window.devicePixelRatio;
		this.canvas.height = this.container.offsetHeight * window.devicePixelRatio;
		this.container.appendChild(this.canvas);

		// get WebGL context
		this.gl = this.canvas.getContext('webgl', options);
		if (!this.gl) {
			throw 'Unable to create a WebGLRenderingContext, please ensure your browser supports WebGL';
		}

		// create renderbuffer
		this.renderBuffer = new RenderBuffer(
			this.gl,
			this.canvas.width,
			this.canvas.height);

		// set pixel ratio
		this.pixelRatio = window.devicePixelRatio;

		// tile size in pixels
		this.tileSize = defaultTo(options.tileSize, 256);

		// min and max zoom of the plot
		this.minZoom = defaultTo(options.minZoom, 0);
		this.maxZoom = defaultTo(options.maxZoom, MAX_ZOOM);

		// current zoom of the plot
		this.zoom = defaultTo(options.zoom, 0);
		this.zoom = clamp(this.zoom, this.minZoom, this.maxZoom);

		// set viewport
		const span = Math.pow(2, this.zoom);
		const width = this.canvas.offsetWidth / span;
		const height = this.canvas.offsetHeight / span;
		this.viewport = new Viewport(0, 0, width, height);

		// center the plot
		const center = defaultTo(options.center, { x: 0.5, y: 0.5 });
		this.viewport.centerOn(center);

		// generate cell
		this.cell = null;
		updateCell(this);

		// wraparound
		this.wraparound = defaultTo(options.wraparound, false);

		// throttled request methods
		const panThrottle = defaultTo(options.panThrottle, PAN_THROTTLE_MS);
		const resizeThrottle = defaultTo(options.resizeThrottle, RESIZE_THROTTLE_MS);
		const zoomThrottle = defaultTo(options.zoomThrottle, ZOOM_THROTTLE_MS);
		this.panRequest = throttle(requestTiles, panThrottle, {
			leading: false // invoke only on trailing edge
		});
		this.resizeRequest = throttle(requestTiles, resizeThrottle, {
			leading: false // invoke only on trailing edge
		});
		this.zoomRequest = throttle(requestTiles, zoomThrottle, {
			leading: false // invoke only on trailing edge
		});

		// layers
		this.layers = [];

		// frame request
		this.frameRequest = null;

		// create and enable handlers
		this[HANDLERS] = new Map();
		this[HANDLERS].set(CLICK, new ClickHandler(this, options));
		this[HANDLERS].set(MOUSE, new MouseHandler(this, options));
		this[HANDLERS].set(PAN, new PanHandler(this, options));
		this[HANDLERS].set(ZOOM, new ZoomHandler(this, options));
		this[HANDLERS].forEach(handler => {
			handler.enable();
		});

		// delegator
		this[DELEGATOR] = new EventDelegator(this);
		// delegate mouse / click events to layers
		this[DELEGATOR].delegate(EventType.CLICK);
		this[DELEGATOR].delegate(EventType.DBL_CLICK);
		this[DELEGATOR].delegate(EventType.MOUSE_MOVE);
		this[DELEGATOR].delegate(EventType.MOUSE_UP);
		this[DELEGATOR].delegate(EventType.MOUSE_DOWN);

		// broadcaster
		this[BROADCASTER] = new EventBroadcaster(this);
		// broadcast zoom / pan events to layers
		this[BROADCASTER].broadcast(EventType.ZOOM_START);
		this[BROADCASTER].broadcast(EventType.ZOOM);
		this[BROADCASTER].broadcast(EventType.ZOOM_END);
		this[BROADCASTER].broadcast(EventType.PAN_START);
		this[BROADCASTER].broadcast(EventType.PAN);
		this[BROADCASTER].broadcast(EventType.PAN_END);

		// whether or not to use dirty checking
		this.dirtyChecking = defaultTo(options.dirtyChecking, true);

		// flag as dirty
		this[DIRTY] = true;

		// begin frame loop
		frame(this);
	}

	/**
	 * Destroys the plots association with the underlying canvas element and
	 * disables all event handlers.
	 *
	 * @returns {Plot} The plot object, for chaining.
	 */
	destroy() {
		// stop animation loop
		cancelAnimationFrame(this.frameRequest);
		this.frameRequest = null;
		// disable handlers
		this[HANDLERS].forEach(handler => {
			handler.disable();
		});
		// remove layers
		this.layers.forEach(layer => {
			this.remove(layer);
		});
		// destroy context
		this.gl = null;
		// remove canvas
		this.container.removeChild(this.canvas);
		this.canvas = null;
		this.container = null;
		this.renderBuffer = null;
		return this;
	}

	/**
	 * Flags the plot as dirty singalling that it should be redrawn in the next
	 * frame.
	 */
	setDirty() {
		this[DIRTY] = true;
	}

	/**
	 * Check if the plot is dirty and requires a redraw.
	 *
	 * @returns {boolean} Whether or not the plot should be redrawn.
 	*/
	isDirty() {
		return this[DIRTY] || this.isPanning() || this.isZooming();
	}

	/**
	 * Clears the dirty flag for the next frame.
	 */
	clearDirty() {
		this[DIRTY] = false;
	}

	/**
	 * Adds a layer to the plot.
	 *
	 * @param {Layer} layer - The layer to add to the plot.
	 *
	 * @returns {Plot} The plot object, for chaining.
	 */
	add(layer) {
		if (!layer) {
			throw 'No argument provided';
		}
		if (this.layers.indexOf(layer) !== -1) {
			throw 'Provided layer is already attached to the plot';
		}
		this.layers.push(layer);
		layer.onAdd(this);
		this.setDirty();
		return this;
	}

	/**
	 * Removes a layer from the plot.
	 *
	 * @param {Layer} layer - The layer to remove from the plot.
	 *
	 * @returns {Plot} The plot object, for chaining.
	 */
	remove(layer) {
		if (!layer) {
			throw 'No argument provided';
		}
		const index = this.layers.indexOf(layer);
		if (index === -1) {
			throw 'Provided layer is not attached to the plot';
		}
		this.layers.splice(index, 1);
		layer.onRemove(this);
		this.setDirty();
		return this;
	}

	/**
	 * Returns all the layer objects attached to the plot, in descending
	 * order of z-index.
	 */
	getSortedLayers() {
		// sort by z-index
		return this.layers.sort((a, b) => {
			return a.getZIndex() - b.getZIndex();
		});
	};

	/**
	 * Returns the current zoom of the plot.
	 *
	 * @returns {Number} The current zoom of the plot.
	 */
	getZoom() {
		return this.zoom;
	}

	/**
	 * Returns the target zoom of the plot. If the plot is actively zooming, it
	 * will return the destination zoom. If the plot is not actively zooming, it
	 * will return the current zoom.
	 *
	 * @returns {Number} The target zoom of the plot.
	 */
	getTargetZoom() {
		if (this.isZooming()) {
			// if zooming, use the target level
			return this.zoomAnimation.targetZoom;
		}
		// if not zooming, use the current level
		return this.zoom;
	}

	/**
	 * Returns the current viewport of the plot.
	 *
	 * @returns {Number} The current viewport of the plot.
	 */
	getViewport() {
		return this.viewport;
	}

	/**
	 * Returns the target viewport of the plot. If the plot is actively zooming,
	 * it will return the target viewport. If the plot is not actively zooming,
	 * it will return the current viewport.
	 *
	 * @returns {Viewport} The target viewport of the plot.
	 */
	getTargetViewport() {
		if (this.isZooming()) {
			// if zooming, use the target viewport
			return this.zoomAnimation.targetViewport;
		}
		// if not zooming, use the current viewport
		return this.viewport;
	}

	/**
	 * Returns the current bottom-left corner of the viewport.
	 *
	 * @returns {Object} The current center in plot coordinates.
	 */
	getViewportPosition() {
		return this.viewport.getPosition();
	}

	/**
	 * Returns the target bottom-left corner of the viewport. If the plot is actively zooming
	 * or panning, it will return the destination center.
	 *
	 * @returns {Object} The target center in plot coordinates.
	 */
	getTargetViewportPosition() {
		return this.getTargetViewport().getPosition();
	}

	/**
	 * Returns the current center of the viewport.
	 *
	 * @returns {Object} The current center in plot coordinates.
	 */
	getViewportCenter() {
		return this.viewport.getCenter();
	}

	/**
	 * Returns the target center of the plot in plot coordinates. If the plot is
	 * actively zooming or panning, it will return the destination center.
	 *
	 * @returns {Object} The target center in plot coordinates.
	 */
	getTargetViewportCenter() {
		return this.getTargetViewport().getCenter();
	}

	/**
	 * Returns the center of the plot in plot coordinates.
	 *
	 * @returns {Object} The target center in plot coordinates.
	 */
	getViewportCenter() {
		return this.viewport.getCenter();
	}

	/**
	 * Returns the tile coordinates visible in the target viewport.
	 *
	 * @returns {Array} The array of visible tile coords.
	 */
	getTargetVisibleCoords() {
		const tileZoom = Math.round(this.getTargetZoom()); // use target zoom
		const viewport = this.getTargetViewport(); // use target viewport
		return viewport.getVisibleCoords(tileZoom, this.wraparound);
	}

	/**
	 * Returns the tile coordinates currently visible in the current viewport.
	 *
	 * @returns {Array} The array of visible tile coords.
	 */
	getVisibleCoords() {
		const tileZoom = Math.round(this.zoom); // use current zoom
		const viewport = this.viewport; // use current viewport
		return viewport.getVisibleCoords(tileZoom, this.wraparound);
	}

	/**
	 * Returns the plot size in pixels.
	 *
	 * @returns {Object} The plot size in pixels.
	 */
	getPixelExtent() {
		return Math.pow(2, this.zoom) * this.tileSize;
	}

	/**
	 * Returns the target plot size in pixels.
	 *
	 * @returns {Object} The target plot size in pixels.
	 */
	getTargetPixelExtent() {
		return Math.pow(2, this.getTargetZoom()) * this.tileSize;
	}

	/**
	 * Returns the viewport size in pixels.
	 *
	 * @returns {Object} The viewport size in pixels.
	 */
	getViewportPixelSize() {
		return this.viewport.getPixelSize(this.zoom, this.tileSize);
	}

	/**
	 * Returns the target viewport size in pixels.
	 *
	 * @returns {Object} The target viewport size in pixels.
	 */
	getTargetViewportPixelSize() {
		return this.getTargetViewport().getPixelSize(this.zoom, this.tileSize);
	}

	/**
	 * Returns the viewport offset in pixels.
	 *
	 * @returns {Object} The viewport offset in pixels.
	 */
	getViewportPixelOffset() {
		return this.viewport.getPixelOffset(this.zoom, this.tileSize);
	}

	/**
	 * Returns the target viewport offset in pixels.
	 *
	 * @returns {Object} The target viewport offset in pixels.
	 */
	getTargetViewportPixelOffset() {
		return this.getTargetViewport().getPixelOffset(this.zoom, this.tileSize);
	}

	/**
	 * Returns the orthographic projection matrix for the viewport.
	 *
	 * @return {Float32Array} The orthographic projection matrix.
	 */
	getOrthoMatrix() {
		const size = this.getViewportPixelSize();
		const left = 0;
		const right = size.width;
		const bottom = 0;
		const top = size.height;
		const near = -1;
		const far = 1;
		const lr = 1 / (left - right);
		const bt = 1 / (bottom - top);
		const nf = 1 / (near - far);
		const out = new Float32Array(16);
		out[0] = -2 * lr;
		out[1] = 0;
		out[2] = 0;
		out[3] = 0;
		out[4] = 0;
		out[5] = -2 * bt;
		out[6] = 0;
		out[7] = 0;
		out[8] = 0;
		out[9] = 0;
		out[10] = 2 * nf;
		out[11] = 0;
		out[12] = (left + right) * lr;
		out[13] = (top + bottom) * bt;
		out[14] = (far + near) * nf;
		out[15] = 1;
		return out;
	}

	/**
	 * Pans to the target plot coordinate. Cancels any current zoom or pan
	 * animations.
	 *
	 * @param {Number} pos - The target plot position.
	 * @param {boolean} animate - Whether or not to animate the pan. Defaults to `true`.
	 *
	 * @returns {Plot} The plot object, for chaining.
	 */
	panTo(pos, animate = true) {
		// cancel existing animations
		this.cancelPan();
		this.cancelZoom();
		this[HANDLERS].get(PAN).panTo(pos, animate);
		this.setDirty();
		return this;
	}

	/**
	 * Zooms in to the target zoom level. This is bounded by the plot objects
	 * minZoom and maxZoom attributes. Cancels any current zoom or pan
	 * animations.
	 *
	 * @param {Number} level - The target zoom level.
	 * @param {boolean} animate - Whether or not to animate the zoom. Defaults to `true`.
	 *
	 * @returns {Plot} The plot object, for chaining.
	 */
	zoomTo(level, animate = true) {
		// cancel existing animations
		this.cancelPan();
		this.cancelZoom();
		this[HANDLERS].get(ZOOM).zoomTo(level, animate);
		this.setDirty();
		return this;
	}

	/**
	 * Fit the plot to a provided bounds in plot coordinates.
	 *
	 * @param {Bounds} bounds - The bounds object, in plot coordinates.
	 *
	 * @returns {Plot} The plot object, for chaining.
	 */
	fitToBounds(bounds) {
		const targetZoom = this.getTargetZoom();
		const targetViewport = this.getTargetViewport();
		const scaleX = targetViewport.width / bounds.getWidth();
		const scaleY = targetViewport.height / bounds.getHeight();
		const scale = Math.min(scaleX, scaleY);
		let zoom = Math.log2(scale) + targetZoom;
		zoom = clamp(zoom, this.minZoom, this.maxZoom);
		if (!this.continuousZoom) {
			zoom = Math.floor(zoom);
		}
		const center = bounds.getCenter();
		this.zoomTo(zoom, false);
		this.panTo(center, false);
		this.setDirty();
		return this;
	}

	/**
	 * Returns whether or not the plot is actively panning.
	 *
	 * @returns {bool} - Whether or not the plot is panning.
	 */
	isPanning() {
		return !!this.panAnimation;
	}

	/**
	 * Returns whether or not the plot is actively zooming.
	 *
	 * @returns {bool} - Whether or not the plot is zooming.
	 */
	isZooming() {
		return !!this.zoomAnimation;
	}

	/**
	 * Cancels any current pan animation.
	 *
	 * @returns {boolean} - Whether or not the plot was panning.
	 */
	cancelPan() {
		if (this.isPanning()) {
			this.panAnimation.cancel();
			this.panAnimation = null;
			return true;
		}
		return false;
	}

	/**
	 * Cancels any current zoom animation.
	 *
	 * @returns {boolean} - Whether or not the plot was zooming.
	 */
	cancelZoom() {
		if (this.isZooming()) {
			this.zoomAnimation.cancel();
			this.zoomAnimation = null;
			return true;
		}
		return false;
	}

	/**
	 * Return the containing element of the plot.
	 *
	 * @returns {DOMElement} The container of the plot.
	 */
	getContainer() {
		return this.container;
	}
}

module.exports = Plot;
