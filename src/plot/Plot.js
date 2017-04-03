'use strict';

const clamp = require('lodash/clamp');
const defaultTo = require('lodash/defaultTo');
const throttle = require('lodash/throttle');
const EventEmitter = require('events');
const EventType = require('../event/EventType');
const CellEvent = require('../event/CellEvent');
const FrameEvent = require('../event/FrameEvent');
const ResizeEvent = require('../event/ResizeEvent');
const RenderBuffer = require('../render/webgl/texture/RenderBuffer');
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

// Private Methods

const requestTiles = function() {
	// get all visible coords in the target viewport
	const coords = this.getTargetVisibleCoords();
	// for each layer
	this.layers.forEach(layer => {
		// request tiles
		layer.requestTiles(coords);
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
		plot.emit(EventType.RESIZE, new ResizeEvent(plot, prev, current));
	}
};

const updateCell = function(plot) {
	const zoom = plot.getTargetZoom();
	const center = plot.getTargetCenter();
	const extent = plot.getTargetPixelExtent();
	const cell = new Cell(zoom, center, extent);

	let refresh = false;
	// check if forced or no cell exists
	if (!plot.cell) {
		refresh = true;
	} else {
		// check if we are outside of one zoom level from last
		const zoomDist = Math.abs(plot.cell.zoom - cell.zoom);
		if (zoomDist >= 1) {
			refresh = true;
		} else {
			// check if we are withing buffer distance of the cell bounds
			const cellDist = plot.cell.halfSize - plot.cell.buffer;
			if (Math.abs(cell.center.x - plot.cell.center.x) > cellDist ||
				Math.abs(cell.center.y - plot.cell.center.y) > cellDist) {
				refresh = true;
			}
		}
	}
	if (refresh) {
		// update cell
		plot.cell = cell;
		// emit cell refresh event
		plot.emit(EventType.CELL_UPDATE, new CellEvent(cell));
	}
};

const reset = function(plot) {
	if (!plot.wraparound) {
		// if there is no wraparound, do not reset
		return;
	}

	// resets the position of the viewport relative to the layer such that
	// the layer native coordinate range is within the viewports bounds.

	// layer is past the left bound of the viewport
	if (plot.viewport.x > 1.0) {
		plot.viewport.x -= plot.viewport.width;
		if (plot.isPanning()) {
			plot.panAnimation.start.x -= plot.viewport.width;
		}
	}
	// layer is past the right bound of the viewport
	if (plot.viewport.x + plot.viewport.width < 0) {
		plot.viewport.x += plot.viewport.width;
		if (plot.isPanning()) {
			plot.panAnimation.start.x += plot.viewport.width;
		}
	}
};

const broadcast = function(plot, type) {
	plot.on(type, event => {
		plot.layers.forEach(layer => {
			layer.emit(type, event);
		});
	});
};

const frame = function(plot) {

	// get frame timestamp
	const timestamp = Date.now();

	// emit start frame
	plot.emit(EventType.FRAME, new FrameEvent(timestamp));

	// update size
	resize(plot);

	const gl = plot.gl;

	// clear the backbuffer
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// set the viewport
	const size = plot.getViewportPixelSize();
	gl.viewport(
		0, 0,
		size.width * window.devicePixelRatio,
		size.height * window.devicePixelRatio);

	// apply the zoom animation
	if (plot.isZooming()) {
		plot.zoomAnimation.update(timestamp);
	}

	// apply the pan animation
	if (plot.isPanning()) {
		plot.panAnimation.update(timestamp);
		plot.panRequest();
	}

	// reset viewport / plot
	reset(plot);

	// update cell
	updateCell(plot);

	// render each layer
	plot.layers.forEach(layer => {
		layer.draw(timestamp);
	});

	// render each overlay
	plot.overlays.forEach(overlays => {
		overlays.draw(timestamp);
	});

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
		this.viewport = new Viewport({
			width: this.canvas.offsetWidth / span,
			height: this.canvas.offsetHeight / span
		});

		// center the plot
		const center = defaultTo(options.center, { x: 0.5, y: 0.5 });
		this.viewport.centerOn(center);

		// wraparound
		this.wraparound = defaultTo(options.wraparound, false);

		// create and enable handlers
		this.handlers = new Map();
		this.handlers.set(CLICK, new ClickHandler(this, options));
		this.handlers.set(MOUSE, new MouseHandler(this, options));
		this.handlers.set(PAN, new PanHandler(this, options));
		this.handlers.set(ZOOM, new ZoomHandler(this, options));
		this.handlers.forEach(handler => {
			handler.enable();
		});

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

		// overlays
		this.overlays = [];

		// frame request
		this.frameRequest = null;

		// broadcast zoom / pan events to layers
		broadcast(this, EventType.ZOOM_START);
		broadcast(this, EventType.ZOOM);
		broadcast(this, EventType.ZOOM_END);
		broadcast(this, EventType.PAN_START);
		broadcast(this, EventType.PAN);
		broadcast(this, EventType.PAN_END);

		// being frame loop
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
		this.handlers.forEach(handler => {
			handler.disable();
		});
		// remove layers
		this.layers.forEach(layer => {
			this.removeLayer(layer);
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
	 * Adds a layer to the plot.
	 *
	 * @param {Layer} layer - The layer to add to the plot.
	 *
	 * @returns {Plot} The plot object, for chaining.
	 */
	addLayer(layer) {
		if (!layer) {
			throw 'No layer argument provided';
		}
		if (this.layers.indexOf(layer) !== -1) {
			throw 'Provided layer is already attached to the plot';
		}
		this.layers.push(layer);
		layer.onAdd(this);
		return this;
	}

	/**
	 * Removes a layer from the plot.
	 *
	 * @param {Layer} layer - The layer to remove from the plot.
	 *
	 * @returns {Plot} The plot object, for chaining.
	 */
	removeLayer(layer) {
		if (!layer) {
			throw 'No layer argument provided';
		}
		const index = this.layers.indexOf(layer);
		if (index === -1) {
			throw 'Provided layer is not attached to the plot';
		}
		this.layers.splice(index, 1);
		layer.onRemove(this);
		return this;
	}

	/**
	 * Adds an overlay to the plot.
	 *
	 * @param {Overlay} overlay - The overlay to add to the plot.
	 *
	 * @returns {Plot} The plot object, for chaining.
	 */
	addOverlay(overlay) {
		if (!overlay) {
			throw 'No overlay argument provided';
		}
		if (this.overlays.indexOf(overlay) !== -1) {
			throw 'Provided overlay is already attached to the plot';
		}
		this.overlays.push(overlay);
		overlay.onAdd(this);
		return this;
	}

	/**
	 * Removes an overlay from the plot.
	 *
	 * @param {Overlay} overlay - The overlay to remove from the plot.
	 *
	 * @returns {Plot} The plot object, for chaining.
	 */
	removeOverlay(overlay) {
		if (!overlay) {
			throw 'No overlay argument provided';
		}
		const index = this.overlays.indexOf(overlay);
		if (index === -1) {
			throw 'Provided overlay is not attached to the plot';
		}
		this.overlays.splice(index, 1);
		overlay.onRemove(this);
		return this;
	}

	/**
	 * Takes a mouse event and returns the corresponding plot position.
	 * Coordinate [0, 0] is bottom-left of the plot.
	 *
	 * @param {Event} event - The mouse event.
	 *
	 * @returns {Object} The plot position.
	 */
	mouseToPlot(event) {
		const extent = this.getPixelExtent();
		const size = this.getViewportPixelSize();
		return {
			x: this.viewport.x + (event.clientX / extent),
			y: this.viewport.y + ((size.height - event.clientY) / extent)
		};
	}

	pixelToPlot(px) {
		const extent = this.getPixelExtent();
		return {
			x: px.x / extent,
			y: px.y / extent
		};
	}

	mouseToPixel(event) {
		const size = this.getViewportPixelSize();
		return {
			x: event.clientX,
			y: size.height - event.clientY
		};
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
	 * Returns the target center of the plot in plot coordinates. If the plot is
	 * actively zooming or panning, it will return the destination center.
	 *
	 * @returns {Object} The target center in plot coordinates.
	 */
	getTargetCenter() {
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
	 * Returns the viewports size in pixels.
	 *
	 * @returns {Object} The viewport size in pixels.
	 */
	getViewportPixelSize() {
		return this.viewport.getPixelSize(this.zoom, this.tileSize);
	}

	/**
	 * Returns the viewports offset in pixels.
	 *
	 * @returns {Object} The viewport offset in pixels.
	 */
	getViewportPixelOffset() {
		return this.viewport.getPixelOffset(this.zoom, this.tileSize);
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
		if (this.isPanning()) {
			this.panAnimation.cancel();
		}
		if (this.isZooming()) {
			this.zoomAnimation.cancel();
		}
		this.handlers.get(PAN).panTo(pos, animate);
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
		if (this.isPanning()) {
			this.panAnimation.cancel();
		}
		if (this.isZooming()) {
			this.zoomAnimation.cancel();
		}
		this.handlers.get(ZOOM).zoomTo(level, animate);
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
		const currentZoom = this.getTargetZoom();
		const extent = Math.pow(2, currentZoom);
		const vWidth = this.viewport.width;
		const vHeight = this.viewport.height;
		const bWidth = bounds.width() * extent;
		const bHeight = bounds.height() * extent;
		const scaleX = vWidth / bWidth;
		const scaleY = vHeight / bHeight;
		const scale = Math.min(scaleX, scaleY);
		let zoom = Math.log2(scale) + currentZoom;
		zoom = clamp(zoom, this.minZoom, this.maxZoom);
		if (!this.continuousZoom) {
			zoom = Math.floor(zoom);
		}
		const bCenter = bounds.getCenter();
		const center = {
			x: bCenter.x * Math.pow(2, zoom),
			y: bCenter.y * Math.pow(2, zoom)
		};
		this.zoomTo(zoom, false);
		this.panTo(center, false);
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
	 * Return the containing element of the plot.
	 *
	 * @returns {DOMElement} The container of the plot.
	 */
	getContainer() {
		return this.container;
	}
}

module.exports = Plot;
