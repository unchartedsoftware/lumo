(function() {

    'use strict';

    const EventType = require('../../event/EventType');
    const ZoomEvent = require('../../event/ZoomEvent');

    /**
     * Class representing a zoom animation.
     */
    class ZoomAnimation {

        /**
         * Instantiates a new ZoomAnimation object.
         *
         * @param {Object} params - The parameters of the animation.
         * @param {Number} params.prevZoom - The starting zoom of the animation.
         * @param {Number} params.targetZoom - The target zoom of the animation.
         * @param {Number} params.prevViewport - The starting viewport of the animation.
         * @param {Number} params.targetViewport - The target viewport of the animation.
         * @param {Number} params.targetPx - The target pixel of the animation.
         * @param {Number} params.duration - The duration of the animation.
         */
        constructor(params = {}) {
            this.timestamp = Date.now();
            this.duration = params.duration;
            this.prevZoom = params.prevZoom;
            this.targetZoom = params.targetZoom;
            this.prevViewport = params.prevViewport;
            this.targetViewport = params.targetViewport;
            this.targetPx = params.targetPx;
        }

        /**
         * Updates the zoom of the plot based on the current state of the
         * animation.
         *
         * @param {Plot} plot - The plot to apply the animation to.
         * @param {Number} timestamp - The frame timestamp.
         */
        updatePlot(plot, timestamp) {
            // get t value
            const t = Math.min(1.0, (timestamp - this.timestamp) / (this.duration || 1));
            // calc new zoom
            const range = this.targetZoom - this.prevZoom;
            const zoom = this.prevZoom + (range * t);
            // set new zoom
            plot.zoom = zoom;
            // calc new viewport position from prev
            plot.viewport = this.prevViewport.zoomFromPlotPx(
                plot.tileSize,
                this.prevZoom,
                plot.zoom,
                this.targetPx);
            // create zoom event
            const event = new ZoomEvent(plot, this.prevZoom, plot.zoom, this.targetZoom);
            // check if animation is finished
            if (t < 1) {
                plot.emit(EventType.ZOOM, event);
            } else {
                plot.emit(EventType.ZOOM_END, event);
                // remove self from plot
                plot.zoomAnimation = null;
            }
        }
    }

    module.exports = ZoomAnimation;

}());
