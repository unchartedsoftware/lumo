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

    const render = function(plot) {
        // update size
        resize(plot);
        // get timestamp
        const timestamp = Date.now();
        const gl = plot.gl;

        // clear the backbuffer
        gl.clearColor(0, 0, 0, 0);

        // enable blending
        gl.enable(gl.BLEND);

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
        // request newxt animation frame
        plot.renderQuest = requestAnimationFrame(() => {
            render(plot);
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
         *
         * @param {Number} options.inertia - Whether or not pan inertia is enabled.
         * @param {Number} options.inertiaEasing - The inertia easing factor.
         * @param {Number} options.inertiaDeceleration - The inertia deceleration factor.
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
                width: this.canvas.width,
                height: this.canvas.height
            });

            // tile size in pixels
            this.tileSize = defaultTo(options.tileSize, 256);

            // min and max zoom of the plot
            this.minZoom = defaultTo(options.minZoom, 0);
            this.maxZoom = defaultTo(options.maxZoom, 30);

            // current zoom of the plot
            this.zoom = defaultTo(options.zoom, 0);
            this.zoom = clamp(this.zoom, this.minZoom, this.maxZoom);

            // create and enable handlers
            this.handlers = new Map();
            this.handlers.set('pan', new PanHandler(this, options));
            this.handlers.set('zoom', new ZoomHandler(this, options));
            this.handlers.forEach(handler => {
                handler.enable();
            });

            // render loop
            this.renderRequest = null;

            // layers
            this.layers = [];

            // being render loop
            render(this);
        }

        /**
         * Destroys the plots association with the underlying canvas element and
         * disables all event handlers.
         *
         * @returns {Plot} The plot object, for chaining.
         */
        destroy() {
            // stop animation loop
            cancelAnimationFrame(this.renderRequest);
            this.renderRequest = null;
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
