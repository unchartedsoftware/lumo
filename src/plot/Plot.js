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
const RenderBuffer = require('../webgl/RenderBuffer');
const ClickHandler = require('./handler/ClickHandler');
const MouseHandler = require('./handler/MouseHandler');
const PanHandler = require('./handler/PanHandler');
const ZoomHandler = require('./handler/ZoomHandler');
const Cell = require('./Cell');
const Viewport = require('./Viewport');

// Constants

/**
 * Pan request throttle in milliseconds.
 *
 * @private
 * @constant {number}
 */
const PAN_THROTTLE_MS = 100;

/**
 * Resize request throttle in milliseconds.
 *
 * @private
 * @constant {number}
 */
const RESIZE_THROTTLE_MS = 200;

/**
 * Zoom request throttle in milliseconds.
 *
 * @private
 * @constant {number}
 */
const ZOOM_THROTTLE_MS = 400;

/**
 * The maximum zoom delta until a cell update event.
 *
 * @private
 * @constant {number}
 */
const CELL_ZOOM_DELTA = 1.0;

/**
 * The maximum zoom level supported.
 *
 * @private
 * @constant {number}
 */
const MAX_ZOOM = 24;

/**
 * Click handler symbol.
 *
 * @private
 * @constant {symbol}
 */
const CLICK = Symbol();

/**
 * Mouse handler symbol.
 *
 * @private
 * @constant {symbol}
 */
const MOUSE = Symbol();

/**
 * Pan handler symbol.
 *
 * @private
 * @constant {symbol}
 */
const PAN = Symbol();

/**
 * Zoom handler symbol.
 *
 * @private
 * @constant {symbol}
 */
const ZOOM = Symbol();

/**
 * Event handlers symbol.
 *
 * @private
 * @constant {symbol}
 */
const HANDLERS = Symbol();

/**
 * Event delegators symbol.
 *
 * @private
 * @constant {symbol}
 */
const DELEGATOR = Symbol();

/**
 * Event broadcasters symbol.
 *
 * @private
 * @constant {symbol}
 */
const BROADCASTER = Symbol();

/**
 * Dirty plot symbol.
 *
 * @private
 * @constant {symbol}
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
		// resize renderbuffer
		if (plot.renderBuffer) {
			plot.renderBuffer.resize(
				current.width * plot.pixelRatio,
				current.height * plot.pixelRatio);
		}
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
	// check if no cell exists
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

const prepareFrame = function(plot) {
	// get context
	const gl = plot.getRenderingContext();
	if (!gl) {
		return;
	}
	// clear the backbuffer
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// set the viewport
	const size = plot.getViewportPixelSize();
	gl.viewport(
		0, 0,
		size.width * plot.pixelRatio,
		size.height * plot.pixelRatio);
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

		// prepare the frame for rendering
		prepareFrame(plot);

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
	 * @param {string} selector - The selector for the container element.
	 * @param {object} options - The plot options.
	 * @param {number} options.tileSize - The dimension in pixels of a tile.
	 * @param {number} options.zoom - The zoom of the plot.
	 * @param {number} options.minZoom - The minimum zoom of the plot.
	 * @param {number} options.maxZoom - The maximum zoom of the plot.
	 * @param {object} options.center - The center of the plot, in plot pixels.
	 * @param {boolean} options.wraparound - Whether or not the plot wraps around.
	 * @param {boolean} options.contextAttributes - The rendering context attribtues argument. Optional.
	 * @param {boolean} options.dirtyChecking - Whether or not the plot uses dirty checking or renders every frame.
	 *
	 * @param {number} options.panThrottle - Pan request throttle timeout in ms.
	 * @param {number} options.resizeThrottle - Resize request throttle timeout in ms.
	 * @param {number} options.zoomThrottle - Zoom request throttle timeout in ms.
	 *
	 * @param {number} options.inertia - Whether or not pan inertia is enabled.
	 * @param {number} options.inertiaEasing - The inertia easing factor.
	 * @param {number} options.inertiaDeceleration - The inertia deceleration factor.
	 *
	 * @param {number} options.continuousZoom - Whether or not continuous zoom is enabled.
	 * @param {number} options.zoomDuration - The duration of the zoom animation.
	 * @param {number} options.maxConcurrentZooms - The maximum concurrent zooms in a single batch.
	 * @param {number} options.deltaPerZoom - The scroll delta required per zoom level.
	 * @param {number} options.zoomDebounce - The debounce duration of the zoom in ms.
	 *
	 * @param {boolean} options.noContext - Prevent the constructor from throwing exception if no WebGL context can be acquired.
	 */
	constructor(selector, options = {}) {
		super();

		// get container
		this.container = document.querySelector(selector);
		if (!this.container) {
			throw `Element could not be found for selector ${selector}`;
		}

		// set pixel ratio
		this.pixelRatio = window.devicePixelRatio;

		// create canvas element
		this.canvas = document.createElement('canvas');
		this.canvas.style.width = `${this.container.offsetWidth}px`;
		this.canvas.style.height = `${this.container.offsetHeight}px`;
		this.canvas.width = this.container.offsetWidth * this.pixelRatio;
		this.canvas.height = this.container.offsetHeight * this.pixelRatio;
		this.container.appendChild(this.canvas);

		// get rendering context
		this.ctx = this.canvas.getContext('webgl', options.contextAttributes) ||
			this.canvas.getContext('experimental-webgl', options.contextAttributes); // MS Edge
		if (!this.ctx && !options.noContext) {
			throw 'Unable to create a WebGLRenderingContext, please ensure your browser supports WebGL';
		}

		if (this.ctx) {
			// create renderbuffer
			this.renderBuffer = new RenderBuffer(
				this.ctx,
				this.canvas.width,
				this.canvas.height);
		} else {
			this.renderBuffer = null;
		}

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
		this.ctx = null;
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
	 * Returns the rendering context of the plot.
	 *
	 * @returns {WebGLRenderingContext|CanvasRenderingContext2D} The context object.
	 */
	getRenderingContext() {
		return this.ctx;
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
	 * @returns {number} The current zoom of the plot.
	 */
	getZoom() {
		return this.zoom;
	}

	/**
	 * Returns the target zoom of the plot. If the plot is actively zooming, it
	 * will return the destination zoom. If the plot is not actively zooming, it
	 * will return the current zoom.
	 *
	 * @returns {number} The target zoom of the plot.
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
	 * @returns {number} The current viewport of the plot.
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
	 * @returns {object} The current center in plot coordinates.
	 */
	getViewportPosition() {
		return this.viewport.getPosition();
	}

	/**
	 * Returns the target bottom-left corner of the viewport. If the plot is actively zooming
	 * or panning, it will return the destination center.
	 *
	 * @returns {object} The target center in plot coordinates.
	 */
	getTargetViewportPosition() {
		return this.getTargetViewport().getPosition();
	}

	/**
	 * Returns the current center of the viewport.
	 *
	 * @returns {object} The current center in plot coordinates.
	 */
	getViewportCenter() {
		return this.viewport.getCenter();
	}

	/**
	 * Returns the target center of the plot in plot coordinates. If the plot is
	 * actively zooming or panning, it will return the destination center.
	 *
	 * @returns {object} The target center in plot coordinates.
	 */
	getTargetViewportCenter() {
		return this.getTargetViewport().getCenter();
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
	 * @returns {object} The plot size in pixels.
	 */
	getPixelExtent() {
		return Math.pow(2, this.zoom) * this.tileSize;
	}

	/**
	 * Returns the target plot size in pixels.
	 *
	 * @returns {object} The target plot size in pixels.
	 */
	getTargetPixelExtent() {
		return Math.pow(2, this.getTargetZoom()) * this.tileSize;
	}

	/**
	 * Returns the viewport size in pixels.
	 *
	 * @returns {object} The viewport size in pixels.
	 */
	getViewportPixelSize() {
		return this.viewport.getPixelSize(this.zoom, this.tileSize);
	}

	/**
	 * Returns the target viewport size in pixels.
	 *
	 * @returns {object} The target viewport size in pixels.
	 */
	getTargetViewportPixelSize() {
		return this.getTargetViewport().getPixelSize(this.zoom, this.tileSize);
	}

	/**
	 * Returns the viewport offset in pixels.
	 *
	 * @returns {object} The viewport offset in pixels.
	 */
	getViewportPixelOffset() {
		return this.viewport.getPixelOffset(this.zoom, this.tileSize);
	}

	/**
	 * Returns the target viewport offset in pixels.
	 *
	 * @returns {object} The target viewport offset in pixels.
	 */
	getTargetViewportPixelOffset() {
		return this.getTargetViewport().getPixelOffset(this.zoom, this.tileSize);
	}

	/**
	 * Takes a DOM event and returns the corresponding plot position.
	 * Coordinate [0, 0] is bottom-left of the plot.
	 *
	 * @param {Event} event - The mouse event.
	 *
	 * @returns {object} The plot position.
	 */
	mouseToPlotCoord(event) {
		const extent = this.getPixelExtent();
		const size = this.getViewportPixelSize();
		const container = this.getContainer();
		const bounds = container.getBoundingClientRect();
		const x = event.pageX - bounds.left;
		const y = event.pageY - bounds.top;
		return {
			x: this.viewport.x + (x / extent),
			y: this.viewport.y + ((size.height - y) / extent)
		};
	}

	/**
	 * Takes a DOM event and returns the corresponding viewport pixel position.
	 * Coordinate [0, 0] is bottom-left of the viewport.
	 *
	 * @param {Event} event - The mouse event.
	 *
	 * @returns {object} The viewport pixel coordinate.
	 */
	mouseToViewportPixel(event) {
		const size = this.getViewportPixelSize();
		const container = this.getContainer();
		const bounds = container.getBoundingClientRect();
		const x = event.pageX - bounds.left;
		const y = event.pageY - bounds.top;
		return {
			x: x,
			y: size.height - y
		};
	}

	/**
	 * Converts a coordinate in viewport pixel space to a normalized plot
	 * coordinate.
	 * Coordinate [0, 0] is bottom-left of the plot.
	 *
	 * @param {object} px - The viewport pixel coordinate.
	 *
	 * @returns {object} The normalized plot coordinate.
	 */
	viewportPixelToPlotCoord(px) {
		const extent = this.getPixelExtent();
		return {
			x: px.x / extent,
			y: px.y / extent
		};
	}

	/**
	 * Converts a coordinate in normalized plot space to viewport pixel space.
	 * Coordinate [0, 0] is bottom-left of the plot.
	 *
	 * @param {object} pos - The normalized plot coordinate
	 *
	 * @returns {object} The viewport pixel coordinate.
	 */
	plotCoordToViewportPixel(pos) {
		const extent = this.plot.getPixelExtent();
		return {
			x: pos.x * extent,
			y: pos.y * extent
		};
	}

	/**
	 * Returns the orthographic projection matrix for the viewport.
	 *
	 * @returns {Float32Array} The orthographic projection matrix.
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
	 * @param {number} pos - The target plot position.
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
	 * @param {number} level - The target zoom level.
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
	 * Zooms in to the target zoom level, centered on the target coordinates. The zoom is bounded by the plot objects
	 * minZoom and maxZoom attributes. Cancels any current zoom or pan animations.
	 *
	 * @param {number} level - The target zoom level.
	 * @param {object} position - The target center position.
	 * @param {boolean} animate - Whether or not to animate the zoom. Defaults to `true`.
	 *
	 * @returns {Plot} The plot object, for chaining.
	 */
	zoomToPosition(level, position, animate = true) {
		// cancel existing animations
		this.cancelPan();
		this.cancelZoom();
		this[HANDLERS].get(ZOOM).zoomToPosition(level, position, animate);
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
	 * @returns {bool} Whether or not the plot is panning.
	 */
	isPanning() {
		return !!this.panAnimation;
	}

	/**
	 * Returns whether or not the plot is actively zooming.
	 *
	 * @returns {bool} Whether or not the plot is zooming.
	 */
	isZooming() {
		return !!this.zoomAnimation;
	}

	/**
	 * Cancels any current pan animation.
	 *
	 * @returns {boolean} Whether or not the plot was panning.
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
	 * @returns {boolean} Whether or not the plot was zooming.
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
	 * Enables the pan event handler on the plot.
	 */
	enablePanning() {
		this[HANDLERS].get(PAN).enable();
	}

	/**
	 * Disables the pan event handler on the plot.
	 */
	disablePanning() {
		this[HANDLERS].get(PAN).disable();
	}

	/**
	 * Enables the zoom event handler on the plot.
	 */
	enableZooming() {
		this[HANDLERS].get(ZOOM).enable();
	}

	/**
	 * Disables the zoom event handler on the plot.
	 */
	disableZooming() {
		this[HANDLERS].get(ZOOM).disable();
	}

	/**
	 * Returns any highlighted data.
	 *
	 * @returns {object} The highlighted data.
	 */
	getHighlighted() {
		const layers = this.layers;
		for (let i=0; i<layers.length; i++) {
			const highlight = layers[i].getHighlighted();
			if (highlight) {
				return highlight;
			}
		}
		return null;
	}

	/**
	 * Returns true if the provided argument is highlighted.
	 *
	 * @param {object} data - The data to test.
	 *
	 * @returns {boolean} Whether or not there is highlighted data.
	 */
	isHighlighted(data) {
		const layers = this.layers;
		for (let i=0; i<layers.length; i++) {
			if (layers[i].isHighlighted(data)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Returns any selected data.
	 *
	 * @returns {Array} The selected data.
	 */
	getSelected() {
		const selection = [];
		const layers = this.layers;
		for (let i=0; i<layers.length; i++) {
			const selected = layers[i].getSelected();
			for (let j=0; j<selected.length; j++) {
				selection.push(selected[j]);
			}
		}
		return selection;
	}

	/**
	 * Returns true if the provided argument is selected.
	 *
	 * @param {object} data - The data to test.
	 *
	 * @returns {boolean} Whether or not the data is selected.
	 */
	isSelected(data) {
		const layers = this.layers;
		for (let i=0; i<layers.length; i++) {
			if (layers[i].isSelected(data)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Return the containing element of the plot.
	 *
	 * @returns {HTMLElement} The container of the plot.
	 */
	getContainer() {
		return this.container;
	}
}

module.exports = Plot;
