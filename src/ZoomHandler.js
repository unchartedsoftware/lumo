(function() {

    'use strict';

    const clamp = require('lodash/clamp');
    const defaultTo = require('lodash/defaultTo');
    const Browser = require('./Browser');
    const Request = require('./Request');
    const Viewport = require('./Viewport');
    const ZoomAnimation = require('./ZoomAnimation');

    // Constants

    /**
     * Amount of scroll pixels per zoom level.
     * @constant {Number}
     */
    const ZOOM_WHEEL_DELTA = 300;

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
    const CONTINUOUS_ZOOM = false;

    // Private Methods

    let last = Date.now();
    const skipInterpolation = function(animation, delta) {
        // NOTE: attempt to determine if the scroll device is a mouse or a
        // trackpad. Mouse scrolling creates large infrequent deltas while
        // trackpads create tons of very small deltas. We want to interpolate
        // between wheel events, but not between trackpad events.
        const now = Date.now();
        const tdelta = now - last;
        last = now;
        if (delta % 4.000244140625 === 0) {
            // definitely a wheel, interpolate
            return false;
        }
        if (Math.abs(delta) < 4) {
            // definitely track pad, do not interpolate
            return true;
        }
        if (animation && animation.duration !== 0) {
            // current animation has interpolation, should probably interpolate
            // the next animation too.
            // NOTE: without this, rapid wheel scrolling will trigger the skip
            // below
            return false;
        }
        if (tdelta < 40) {
            // events are close enough together that we should probably
            // not interpolate
            return true;
        }
        return false;
    };

    const computeZoomDelta = function(wheelDelta, continuousZoom, deltaPerZoom, maxZooms) {
        let zoomDelta = wheelDelta / deltaPerZoom;
        if (!continuousZoom) {
            // snap value if not continuous zoom
            if (wheelDelta > 0) {
                zoomDelta = Math.ceil(zoomDelta);
            } else {
                zoomDelta = Math.floor(zoomDelta);
            }
        }
        // clamp zoom delta to max concurrent zooms
        return clamp(zoomDelta, -maxZooms, maxZooms);
    };

    const computeTargetZoom = function(zoomDelta, currentZoom, currentAnimation, minZoom, maxZoom) {
        let targetZoom;
        if (currentAnimation) {
            // append to existing animation target
            targetZoom = currentAnimation.targetZoom + zoomDelta;
        } else {
            targetZoom = currentZoom + zoomDelta;
        }
        // clamp the target zoom to min and max zoom level of plot
        return clamp(targetZoom, minZoom, maxZoom);
    };

    const zoom = function(handler, plot, targetPx, wheelDelta, continuousZoom) {
        // calculate zoom delta
        const zoomDelta = computeZoomDelta(
            wheelDelta,
            continuousZoom,
            handler.deltaPerZoom,
            handler.maxConcurrentZooms);
        // calculate target zoom level
        const targetZoom = computeTargetZoom(
            zoomDelta,
            plot.zoom,
            plot.zoomAnimation,
            plot.minZoom,
            plot.maxZoom);
        // check if we need to zoom
        if (zoomDelta !== 0 && targetZoom !== plot.zoom) {
            // set target viewport
            const targetViewport = plot.viewport.zoomFromPlotPx(
                plot.tileSize,
                plot.zoom,
                targetZoom,
                targetPx);
            // clear pan animation
            plot.panAnimation = null;
            // get duration
            let duration = handler.zoomDuration;
            if (continuousZoom && skipInterpolation(plot.zoomAnimation, wheelDelta)) {
                // skip animation interpolation
                duration = 0;
            }
            // set zoom animation
            plot.zoomAnimation = new ZoomAnimation({
                duration: duration,
                prevZoom: plot.zoom,
                targetZoom: targetZoom,
                prevViewport: new Viewport(plot.viewport),
                targetViewport: targetViewport,
                targetPx: targetPx
            });
            // request tiles
            Request.zoomRequest(plot, targetViewport, targetZoom);
            // emit zoom start
            plot.emit(Event.ZOOM_START, plot);
        }
    };

    const getWheelDelta = function(event) {
        if (event.deltaMode === 0) {
            // pixels
            if (Browser.firefox) {
                return -event.deltaY / window.devicePixelRatio;
            }
            return -event.deltaY;
        } else if (event.deltaMode === 1) {
            // lines
            return -event.deltaY * 20;
        }
        // pages
        return -event.deltaY * 60;
    };

    /**
     * Class representing a zoom handler.
     */
    class ZoomHandler {

        /**
         * Instantiates a new ZoomHandler object.
         *
         * @param {Plot} plot - The plot to attach the handler to.
         * @param {Object} options - The parameters of the animation.
         * @param {Number} options.continuousZoom - Whether or not continuous zoom is enabled.
         * @param {Number} options.zoomDuration - The duration of the zoom animation.
         * @param {Number} options.maxConcurrentZooms - The maximum concurrent zooms in a single batch.
         * @param {Number} options.deltaPerZoom - The scroll delta required per zoom level.
         * @param {Number} options.zoomDebounce - The debounce duration of the zoom in ms.
         */
        constructor(plot, options = {}) {
            this.continuousZoom = defaultTo(options.continuousZoom, CONTINUOUS_ZOOM);
            this.zoomDuration = defaultTo(options.zoomDuration, ZOOM_ANIMATION_MS);
            this.maxConcurrentZooms = defaultTo(options.maxConcurrentZooms, MAX_CONCURRENT_ZOOMS);
            this.deltaPerZoom = defaultTo(options.deltaPerZoom, ZOOM_WHEEL_DELTA);
            this.zoomDebounce = defaultTo(options.zoomDebounce, ZOOM_DEBOUNCE_MS);
            this.plot = plot;
            this.enabled = false;
        }

        /**
         * Enables the handler.
         *
         * @returns {PanHandler} The handler object, for chaining.
         */
        enable() {
            if (this.enabled) {
                throw 'Handler is already enabled';
            }

            let wheelDelta = 0;
            let timeout = null;
            let evt = null;

            this.dblclick = () => {
                // get mouse position
                const targetPx = this.plot.mouseToPlotPx(event);
                zoom(this, this.plot, targetPx, this.deltaPerZoom, false);
            };

            this.wheel = (event) => {
                // increment wheel delta
                wheelDelta += getWheelDelta(event);
                // check zoom type
                if (this.continuousZoom) {
                    // get target pixel from mouse position
                    const targetPx = this.plot.mouseToPlotPx(event);
                    // process continuous zoom immediately
                    zoom(this, this.plot, targetPx, wheelDelta, true);
                    // reset wheel delta
                    wheelDelta = 0;
                } else {
                    // set event
                    evt = event;
                    // debounce discrete zoom
                    if (!timeout) {
                        timeout = setTimeout(() => {
                            // get target pixel from mouse position
                            // NOTE: this is called inside the closure to ensure
                            // that we use the current viewport of the plot to
                            // convert from mouse to plot pixels
                            const targetPx = this.plot.mouseToPlotPx(evt);
                            // process zoom event
                            zoom(this, this.plot, targetPx, wheelDelta, false);
                            // reset wheel delta
                            wheelDelta = 0;
                            // clear timeout
                            timeout = null;
                            // clear event
                            evt = null;
                        }, this.zoomDebounce);
                    }
                }
                // prevent default behavior and stop propagationa
                event.preventDefault();
                event.stopPropagation();
            };

            this.plot.canvas.addEventListener('dblclick', this.dblclick);
            this.plot.canvas.addEventListener('wheel', this.wheel);
            this.enabled = true;
        }

        /**
         * Disables the handler.
         *
         * @returns {PanHandler} The handler object, for chaining.
         */
        removeFrom() {
            if (this.enabled) {
                throw 'Handler is already disabled';
            }
            this.plot.canvas.removeEventListener('dblclick', this.dblclick);
            this.plot.canvas.removeEventListener('wheel', this.wheel);
            this.dblclick = null;
            this.wheel = null;
            this.enabled = false;
        }
    }

    module.exports = ZoomHandler;

}());
