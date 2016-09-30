(function() {

    'use strict';

    const esper = require('esper');
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
            // TODO: high res displays
            plot.canvas.width = width * window.devicePixelRatio;
            plot.canvas.height = height * window.devicePixelRatio;
            // resize render target
            plot.renderBuffer.resize(
                width * window.devicePixelRatio,
                height * window.devicePixelRatio);
            // update viewport
            plot.viewport.width = width;
            plot.viewport.height = height;
            // update target viewport
            plot.targetViewport.width = width;
            plot.targetViewport.height = height;
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
        if (plot.zoomAnimation && plot.zoomAnimation.done()) {
            plot.zoomAnimation = null;
            plot.emit(Event.ZOOM_END, plot);
        }
        // remove pan animation once complete
        if (plot.panAnimation && plot.panAnimation.done()) {
            plot.panAnimation = null;
            plot.emit(Event.PAN_END, plot);
        }
        // request newxt animation frame
        plot.renderQuest = requestAnimationFrame(() => {
            render(plot);
        });
    };

    // Class / Public Methods

    class Plot extends EventEmitter {
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
            this.prevViewport = new Viewport(this.viewport);
            this.targetViewport = new Viewport(this.viewport);

            this.tileSize = defaultTo(options.tileSize, 256);

            this.minZoom = defaultTo(options.minZoom, 0);
            this.maxZoom = defaultTo(options.maxZoom, 30);

            this.zoom = defaultTo(options.zoom, 0);
            this.zoom = Math.min(this.maxZoom, this.zoom);
            this.zoom = Math.max(this.minZoom, this.zoom);

            this.prevZoom = this.zoom;
            this.targetZoom = this.zoom;

            this.panHandler = new PanHandler(this, options);
            this.zoomHandler = new ZoomHandler(this, options);

            // render loop
            this.renderRequest = null;

            this.layers = [];

            render(this);
        }
        destroy() {
            // stop animation loop
            cancelAnimationFrame(this.renderRequest);
            this.renderRequest = null;
            // destroy context
            esper.WebGLContext.remove(this.canvas);
            this.gl = null;
            this.canvas = null;
        }
        add(layer) {
            if (!layer) {
                throw `No argument supplied`;
            }
            if (this.layers.indexOf(layer) < 0) {
                this.layers.push(layer);
                layer.activate(this);
            }
            // request tiles
            Request.requestTiles(this, this.viewport, this.zoom);
        }
        remove(layer) {
            if (!layer) {
                throw `No argument supplied`;
            }
            const index = this.layers.indexOf(layer);
            if (index >= 0) {
                this.layers.splice(index, 1);
                layer.deactivate(this);
            }
        }
        mouseToViewPx(event) {
            return {
                x: event.clientX,
                y: this.viewport.height - event.clientY
            };
        }
        mouseToPlotPx(event) {
            return this.viewPxToPlotPx(this.mouseToViewPx(event));
        }
        viewPxToPlotPx(px) {
            return {
                x: this.viewport.x + px.x,
                y: this.viewport.y + px.y
            };
        }
        plotPxToViewPx(px) {
            return {
                x: px.x - this.viewport.x,
                y: px.y - this.viewport.y
            };
        }
    }

    module.exports = Plot;

}());
