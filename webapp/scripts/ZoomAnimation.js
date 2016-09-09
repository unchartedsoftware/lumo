(function() {

    'use strict';

    const Const = require('./Const');

    // Private Methods

    // Class / Public Methods

    class ZoomAnimation {
        constructor(spec = {}) {
            this.timestamp = Date.now();
            this.duration = Const.ZOOM_ANIMATION_MS;
            this.zoomFrom = spec.zoomFrom;
            this.zoomTo = spec.zoomTo;
            this.viewportFrom = spec.viewportFrom;
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
            const zoom = this.zoomFrom + range * t;
            // set new zoom
            plot.zoom = zoom;
            // calc new viewport position
            const current = Math.pow(2, plot.zoom);
            const prev = Math.pow(2, plot.prevZoom);
            const scale = (current - prev) / 2;
            const change = plot.tileSize * scale;
            // set new viewport position
            plot.viewport.pos[0] = this.viewportFrom.pos[0] + change;
            plot.viewport.pos[1] = this.viewportFrom.pos[1] + change;
        }
        done() {
            return this.finished;
        }
    }

    module.exports = ZoomAnimation;

}());
