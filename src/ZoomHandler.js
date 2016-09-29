(function() {

    'use strict';

    const Const = require('./Const');
    const Request = require('./Request');
    const Viewport = require('./Viewport');
    const ZoomAnimation = require('./ZoomAnimation');

    // Private Methods

    const zoom = function(plot, targetPx, zoomDelta, minZoom, maxZoom) {
        // calculate the target zoom level
        let targetZoom = plot.targetZoom + zoomDelta;
        targetZoom = Math.min(maxZoom, targetZoom);
        targetZoom = Math.max(minZoom, targetZoom);
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
            // set zoom animation
            plot.zoomAnimation = new ZoomAnimation({
                zoomFrom: plot.zoom,
                zoomTo: plot.targetZoom,
                targetPx: targetPx
            });
            // store prev zoom
            plot.prevZoom = plot.zoom;
            // store prev viewport
            plot.prevViewport = new Viewport(plot.viewport);
        }
    };

    const discreteZoom = function(plot, targetPx, wheelDelta, minZoom, maxZoom) {
        // map the delta with a sigmoid function
        let zoomDelta = wheelDelta / (Const.ZOOM_WHEEL_DELTA * Const.MAX_CONCURRENT_ZOOMS);
        zoomDelta = Const.MAX_CONCURRENT_ZOOMS * Math.log(2 / (1 + Math.exp(-Math.abs(zoomDelta)))) / Math.LN2;
        zoomDelta = Math.ceil(zoomDelta);
        zoomDelta = wheelDelta > 0 ? zoomDelta : -zoomDelta;
        zoomDelta = Math.min(Const.MAX_CONCURRENT_ZOOMS, zoomDelta);
        zoomDelta = Math.max(-Const.MAX_CONCURRENT_ZOOMS, zoomDelta);
        // zoom the plot
        zoom(plot, targetPx, zoomDelta, minZoom, maxZoom);
        // request tiles
        Request.zoomRequest(plot);
        // emit zoom start
        plot.emit(Event.ZOOM_START, plot);
    };

    const continuousZoom = function(plot, targetPx, wheelDelta, minZoom, maxZoom) {
        // convert wheel delta to zoom delta
        const zoomDelta = wheelDelta / Const.ZOOM_WHEEL_DELTA;
        // zoom the plot
        zoom(plot, targetPx, zoomDelta, minZoom, maxZoom);
        // request tiles without throttle
        Request.requestTiles(plot);
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

            this.continuousZoom = (options.continuousZoom !== undefined) ? options.continuousZoom : true;
            this.minZoom = Math.max(Const.MIN_ZOOM, options.minZoom || Const.MIN_ZOOM);
            this.maxZoom = Math.min(Const.MAX_ZOOM, options.maxZoom || Const.MAX_ZOOM);

            let wheelDelta = 0;
            let timeout = null;

            plot.canvas.addEventListener('dblclick', () => {
                discreteZoom(
                    plot,
                    plot.mouseToPlotPx(event),
                    Const.ZOOM_WHEEL_DELTA,
                    this.minZoom,
                    this.maxZoom);
            });

            plot.canvas.addEventListener('wheel', event => {
                // increment wheel delta
                wheelDelta += getWheelDelta(event);
                // check zoom type
                if (this.continuousZoom) {
                    // process continuous zoom immediately
                    continuousZoom(
                        plot,
                        plot.mouseToPlotPx(event),
                        wheelDelta,
                        this.minZoom,
                        this.maxZoom);
                    wheelDelta = 0;
                } else {
                    // debounce discrete zoom
                    if (!timeout) {
                        timeout = setTimeout(() => {
                            discreteZoom(
                                plot,
                                plot.mouseToPlotPx(event),
                                wheelDelta,
                                this.minZoom,
                                this.maxZoom);
                            wheelDelta = 0;
                            timeout = null;
                        }, Const.ZOOM_DEBOUNCE);
                    }
                }
                // prevent default behavior and stop propagationa
                event.preventDefault();
                event.stopPropagation();
            });
        }
    }

    module.exports = ZoomHandler;

}());
