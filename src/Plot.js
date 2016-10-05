(function() {

    'use strict';

    const esper = require('esper');
    const clamp = require('lodash/clamp');
    const defaultTo = require('lodash/defaultTo');
    const throttle = require('lodash/throttle');
    const EventEmitter = require('events');
    const Event = require('./Event');
    const Request = require('./Request');
    const Viewport = require('./Viewport');
    const PanHandler = require('./PanHandler');
    const ZoomHandler = require('./ZoomHandler');

    // Constants

    /**
     * Resize request throttle in milliseconds.
     * @constant {Number}
     */
    const RESIZE_THROTTLE_MS = 200;

    // Private Methods

    const resize = throttle(function(plot) {
        const width = plot.canvas.offsetWidth;
        const height = plot.canvas.offsetHeight;
        if (plot.viewport.width !== width || plot.viewport.height !== height) {
            // resize canvas
            plot.canvas.width = width * window.devicePixelRatio;
            plot.canvas.height = height * window.devicePixelRatio;
            // resize render target
            plot.renderBuffer.resize(
                width * window.devicePixelRatio,
                height * window.devicePixelRatio);
            // update viewport
            plot.viewport.width = width;
            plot.viewport.height = height;
            // request tiles
            Request.requestTiles(plot);
            // emit resize
            plot.emit(Event.RESIZE, {});
        }
    }, RESIZE_THROTTLE_MS);

    const reset = function(plot) {
        if (!plot.wraparound) {
            // if there is no wraparound, do not reset
            return;
        }
        // resets the position of the viewport relative to the layer such that
        // the layer native coordinate range is within the viewports bounds.
        // NOTE: This does not have any observable effect.
        const dim = Math.pow(2, plot.zoom);
        const layerWidth = dim * plot.tileSize;
        const layerSpans = Math.ceil(plot.viewport.width / layerWidth);
        const layerLeft = 0;
        const layerRight = layerWidth - 1;
        // layer is past the left bound of the viewport
        if (plot.viewport.x > layerRight) {
            plot.viewport.x -= layerWidth * layerSpans;
            if (plot.panAnimation) {
                plot.panAnimation.start.x -= layerWidth * layerSpans;
            }
        }
        // layer is past the right bound of the viewport
        if (plot.viewport.x + plot.viewport.width < layerLeft) {
            plot.viewport.x += layerWidth * layerSpans;
            if (plot.panAnimation) {
                plot.panAnimation.start.x += layerWidth * layerSpans;
            }
        }
    };

    const frame = function(plot) {
        // update size
        resize(plot);

        // get timestamp
        const timestamp = Date.now();
        const gl = plot.gl;

        // clear the backbuffer
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // set the viewport
        gl.viewport(
            0, 0,
            plot.viewport.width * window.devicePixelRatio,
            plot.viewport.height * window.devicePixelRatio);

        // apply the zoom animation
        if (plot.zoomAnimation) {
            plot.zoomAnimation.updatePlot(plot, timestamp);
        }
        // apply the pan animation
        if (plot.panAnimation) {
            plot.panAnimation.updatePlot(plot, timestamp);
            Request.panRequest(plot);
        }
        // render each layer
        plot.layers.forEach(layer => {
            layer.draw(timestamp);
        });
        // remove zoom animation once complete
        if (plot.zoomAnimation && plot.zoomAnimation.isFinished()) {
            plot.zoomAnimation = null;
            plot.emit(Event.ZOOM_END, plot);
        }
        // remove pan animation once complete
        if (plot.panAnimation && plot.panAnimation.isFinished()) {
            plot.panAnimation = null;
            plot.emit(Event.PAN_END, plot);
        }
        // reset viewport / plot
        reset(plot);
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
         * @param {boolean} options.wraparound - Whether or not the plot wraps around.
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
            this.canvas = document.querySelector(selector);
            if (!this.canvas) {
                throw `Element could not be found for selector ${selector}`;
            }
            try {
                this.gl = esper.WebGLContext.get(this.canvas);
            } catch(err) {
                throw `Unable to create a WebGLRenderingContext, please ensure your browser supports WebGL`;
            }
            this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio;
            this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio;

            // set render target
            this.renderTexture = new esper.ColorTexture2D({
                width: this.canvas.width,
                height: this.canvas.height,
                filter: 'NEAREST',
                wrap: 'CLAMP_TO_EDGE',
                mipMap: false,
                premultiplyAlpha: false
            });
            this.renderBuffer = new esper.RenderTarget();
            this.renderBuffer.setColorTarget(this.renderTexture, 0);

            // set viewport
            this.viewport = new Viewport({
                width: this.canvas.offsetWidth,
                height: this.canvas.offsetHeight
            });

            // tile size in pixels
            this.tileSize = defaultTo(options.tileSize, 256);

            // min and max zoom of the plot
            this.minZoom = defaultTo(options.minZoom, 0);
            this.maxZoom = defaultTo(options.maxZoom, 30);

            // current zoom of the plot
            this.zoom = defaultTo(options.zoom, 0);
            this.zoom = clamp(this.zoom, this.minZoom, this.maxZoom);

            // center the plot
            const center = Math.pow(2, this.zoom) * this.tileSize / 2;
            this.viewport.centerOn({
                x: center,
                y: center
            });

            // wraparound
            this.wraparound = defaultTo(options.wraparound, false);

            // create and enable handlers
            this.handlers = new Map();
            this.handlers.set('pan', new PanHandler(this, options));
            this.handlers.set('zoom', new ZoomHandler(this, options));
            this.handlers.forEach(handler => {
                handler.enable();
            });

            // layers
            this.layers = [];

            // frame request
            this.frameRequest = null;

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
            // destroy context
            esper.WebGLContext.remove(this.canvas);
            this.gl = null;
            this.canvas = null;
            // disable handlers
            this.handlers.forEach(handler => {
                handler.disable();
            });
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
                throw `No layer argument provided`;
            }
            if (this.layers.indexOf(layer) !== -1) {
                throw 'Provided layer is already attached to the plot';
            }
            this.layers.push(layer);
            layer.onAdd(this);
            // request tiles
            Request.requestTiles(this, this.viewport, this.zoom);
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
                throw `No layer argument provided`;
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
         * Takes a mouse event and returns the corresponding viewport pixel
         * position. Coordinate [0, 0] is bottom-left of the viewport.
         *
         * @param {Event} event - The mouse event.
         *
         * @returns {Object} The viewport pixel position.
         */
        mouseToViewPx(event) {
            return {
                x: event.clientX,
                y: this.viewport.height - event.clientY
            };
        }

        /**
         * Takes a mouse event and returns the corresponding plot pixel
         * position. Coordinate [0, 0] is bottom-left of the plot.
         *
         * @param {Event} event - The mouse event.
         *
         * @returns {Object} The plot pixel position.
         */
        mouseToPlotPx(event) {
            return this.viewPxToPlotPx(this.mouseToViewPx(event));
        }

        /**
         * Takes a viewport pixel position and returns the corresponding plot
         * pixel position. Coordinate [0, 0] is bottom-left of the plot.
         *
         * @param {Object} px - The viewport pixel position.
         *
         * @returns {Object} The plot pixel position.
         */
        viewPxToPlotPx(px) {
            return {
                x: this.viewport.x + px.x,
                y: this.viewport.y + px.y
            };
        }

        /**
         * Takes a plot pixel position and returns the corresponding viewport
         * pixel position. Coordinate [0, 0] is bottom-left of the viewport.
         *
         * @param {Object} px - The plot pixel position.
         *
         * @returns {Object} The viewport pixel position.
         */
        plotPxToViewPx(px) {
            return {
                x: px.x - this.viewport.x,
                y: px.y - this.viewport.y
            };
        }
    }

    module.exports = Plot;

}());
