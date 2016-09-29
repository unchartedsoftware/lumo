(function() {

    'use strict';

    // Class / Public Methods

    class PanAnimation {
        constructor(spec = {}) {
            this.timestamp = Date.now();
            this.start = spec.start;
            this.delta = spec.delta;
            this.easing = spec.easing;
            this.duration = spec.duration;
            this.finished = false;
        }
        updatePlot(plot, timestamp) {
            const t = Math.min(1.0, (timestamp - this.timestamp) / this.duration);
            if (t >= 1) {
                this.finished = true;
            }
            const progress = 1 - Math.pow(1 - t, 1 / this.easing);

            const pos = {
                x: this.start.x + this.delta.x * progress,
                y: this.start.y + this.delta.y * progress
            };

            plot.viewport.x = pos.x;
            plot.viewport.y = pos.y;
            plot.targetViewport.x = pos.x;
            plot.targetViewport.y = pos.y;

            plot.emit(Event.PAN);
        }
        done() {
            return this.finished;
        }
    }

    module.exports = PanAnimation;

}());
