(function() {

    'use strict';

    // Class / Public Methods

    class ZoomAnimation {
        constructor(spec = {}) {
            this.timestamp = Date.now();
            this.duration = spec.duration;
            this.zoomFrom = spec.zoomFrom;
            this.zoomTo = spec.zoomTo;
            this.targetPx = spec.targetPx;
            this.finished = false;
        }
        updatePlot(plot, timestamp) {
            // get t value
            const t = Math.min(1.0, (timestamp - this.timestamp) / this.duration);
            // check if animation is finished
            if (t >= 1) {
                this.finished = true;
            }
            // calc new zoom
            const range = this.zoomTo - this.zoomFrom;
            const zoom = this.zoomFrom + (range * t);
            // set new zoom
            plot.zoom = zoom;
            // calc new viewport position from prev
            plot.viewport = plot.prevViewport.zoomFromPlotPx(
                plot.tileSize,
                plot.prevZoom,
                plot.zoom,
                this.targetPx);
            // emit zoom
            plot.emit(Event.ZOOM);
        }
        done() {
            return this.finished;
        }
    }

    module.exports = ZoomAnimation;

}());
