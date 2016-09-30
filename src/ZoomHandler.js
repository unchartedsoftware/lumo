(function() {

    'use strict';

    const defaultTo = require('lodash/defaultTo');
    const Request = require('./Request');
    const Viewport = require('./Viewport');
    const ZoomAnimation = require('./ZoomAnimation');

    // Constants

    /**
     * Amount of scroll pixels per zoom level.
     * @constant {Number}
     */
    const ZOOM_WHEEL_DELTA = 200;

    /**
     * Length of zoom animation in milliseconds.
     * @constant {Number}
     */
    const ZOOM_ANIMATION_MS = 250;

    /**
     * Maximum concurrent discrete zooms in a single batch.
     * @constant {Number}
     */
    const MAX_CONCURRENT_ZOOMS = 4;

    /**
     * Zoom debounce delay in miliseconds.
     * @constant {Number}
     */
    const ZOOM_DEBOUNCE_MS = 100;

    /**
     * Continuous zoom enabled.
     * @constant {boolean}
     */
    const CONTINUOUS_ZOOM = true;

    /**
     * Continuous zoom smoothing factor.
     * @constant {Number}
     */
    const CONTINUOUS_ZOOM_SMOOTH = 2;

    // Private Methods

    const zoom = function(handler, plot, targetPx, wheelDelta) {
        // map the delta with a sigmoid function
        let zoomDelta = wheelDelta / handler.zoomWheelDelta;
        // snap value if not continuous zoom
        if (!handler.continuousZoom) {
            if (wheelDelta > 0) {
                zoomDelta = Math.ceil(zoomDelta);
            } else {
                zoomDelta = Math.floor(zoomDelta);
            }
        }
        // clamp zoom delta
        zoomDelta = Math.min(zoomDelta, handler.maxConcurrentZooms);
        zoomDelta = Math.max(zoomDelta, -handler.maxConcurrentZooms);
        // calculate the target zoom level
        let targetZoom = plot.targetZoom + zoomDelta;
        targetZoom = Math.max(plot.minZoom, targetZoom);
        targetZoom = Math.min(plot.maxZoom, targetZoom);
        // check if we need to zoom
        if (targetZoom !== plot.targetZoom) {
            // set target zoom
            plot.targetZoom = targetZoom;
            // set target viewport
            plot.targetViewport = plot.viewport.zoomFromPlotPx(
                plot.tileSize,
                plot.zoom,
                plot.targetZoom,
                targetPx);
            // clear pan animation
            plot.panAnimation = null;
            // get duration
            let duration = handler.zoomDuration;
            if (handler.continuousZoom) {
                // scale duration by amount zoomed, this allows trackpads to
                // have proper inertia
                duration = Math.abs(handler.zoomDuration * zoomDelta) * CONTINUOUS_ZOOM_SMOOTH;
            }
            // set zoom animation
            plot.zoomAnimation = new ZoomAnimation({
                duration: duration,
                zoomFrom: plot.zoom,
                zoomTo: plot.targetZoom,
                targetPx: targetPx
            });
            // store prev zoom
            plot.prevZoom = plot.zoom;
            // store prev viewport
            plot.prevViewport = new Viewport(plot.viewport);
        }
        // request tiles
        Request.zoomRequest(plot);
        // emit zoom start
        plot.emit(Event.ZOOM_START, plot);
    };

    const getWheelDelta = function(event) {
        if (event.deltaMode === 0) {
            // pixels
            return -event.deltaY;
        } else if (event.deltaMode === 1) {
            // lines
            return -event.deltaY * 20;
        }
        // pages
        return -event.deltaY * 60;
    };

    // Class / Public Methods

    class ZoomHandler {
        constructor(plot, options = {}) {

            this.continuousZoom = defaultTo(options.continuousZoom, CONTINUOUS_ZOOM);
            this.zoomDuration = defaultTo(options.zoomDuration, ZOOM_ANIMATION_MS);
            this.maxConcurrentZooms = defaultTo(options.maxConcurrentZooms, MAX_CONCURRENT_ZOOMS);
            this.zoomWheelDelta = defaultTo(options.zoomWheelDelta, ZOOM_WHEEL_DELTA);
            this.zoomDebounce = defaultTo(options.zoomDebounce, ZOOM_DEBOUNCE_MS);

            let wheelDelta = 0;
            let timeout = null;
            let evt = null;

            plot.canvas.addEventListener('dblclick', () => {
                // get mouse position
                const targetPx = plot.mouseToPlotPx(event);
                zoom(this, plot, targetPx, this.zoomWheelDelta);
            });

            plot.canvas.addEventListener('wheel', event => {
                // increment wheel delta
                wheelDelta += getWheelDelta(event);
                // check zoom type
                if (this.continuousZoom) {
                    // get target pixel from mouse position
                    const targetPx = plot.mouseToPlotPx(event);
                    // process continuous zoom immediately
                    zoom(this, plot, targetPx, wheelDelta);
                    // reset wheel delta
                    wheelDelta = 0;
                } else {
                    // debounce discrete zoom
                    if (!timeout) {
                        timeout = setTimeout(() => {
                            // get target pixel from mouse position
                            // NOTE: this is called inside to closure to ensure
                            // that we used the current viewport of the plot to
                            // convert from mouse to plot pixels
                            const targetPx = plot.mouseToPlotPx(evt);
                            // process zoom event
                            zoom(this, plot, targetPx, wheelDelta);
                            // reset wheel delta
                            wheelDelta = 0;
                            // clear timeout
                            timeout = null;
                            evt = null;
                        }, this.zoomDebounce);
                    }
                    evt = event;
                }
                // prevent default behavior and stop propagationa
                event.preventDefault();
                event.stopPropagation();
            });
        }
    }

    module.exports = ZoomHandler;

}());
