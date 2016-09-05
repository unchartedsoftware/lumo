(function() {

    'use strict';

    const glm = require('gl-matrix');
    const Const = require('./Const');

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
        t(timestamp) {
            const t = Math.min(1.0, (timestamp - this.timestamp) / this.duration);
            if (t >= 1) {
                this.finished = true;
            }
            return t;
        }
        z(timestamp) {
            const t = this.t(timestamp);
            const range = this.zoomTo - this.zoomFrom;
            return this.zoomFrom + range * t;
        }
        viewportPx(plot, timestamp) {
            const z = this.z(timestamp);
            const current = Math.pow(2, z);
            const prev = Math.pow(2, plot.zoom);
            const scale = (current - prev) / 2;
            const change = plot.tileSize * scale;
            return glm.vec2.add(
                glm.vec2.create(),
                this.viewportFrom,
                glm.vec2.fromValues(change, change));
        }
        done() {
            return this.finished;
        }
    }

    module.exports = ZoomAnimation;

}());
