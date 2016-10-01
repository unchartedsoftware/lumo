(function() {

    'use strict';

    /**
     * Class representing a pan animation.
     */
    class PanAnimation {

        /**
         * Instantiates a new PanAnimation object.
         *
         * @param {Object} params - The parameters of the animation.
         * @param {Number} params.start - The start timestamp of the animation.
         * @param {Number} params.delta - The positional delta of the animation.
         * @param {Number} params.easing - The easing factor of the animation.
         * @param {Number} params.duration - The duration of the animation.
         */
        constructor(params = {}) {
            this.timestamp = Date.now();
            this.start = params.start;
            this.delta = params.delta;
            this.easing = params.easing;
            this.duration = params.duration;
            this.finished = false;
        }

        /**
         * Updates the position of the plot based on the current state of the
         * animation.
         *
         * @param {Plot} plot - The plot to apply the animation to.
         * @param {Number} timestamp - The frame timestamp.
         */
        updatePlot(plot, timestamp) {
            const t = Math.min(1.0, (timestamp - this.timestamp) / (this.duration || 1));
            if (t === 1) {
                this.finished = true;
            }
            // calculate the progress of the animation
            const progress = 1 - Math.pow(1 - t, 1 / this.easing);
            // caclulate the current position along the pan
            const pos = {
                x: this.start.x + this.delta.x * progress,
                y: this.start.y + this.delta.y * progress
            };
            // set the viewport positions
            plot.viewport.x = pos.x;
            plot.viewport.y = pos.y;
            // emit pan
            plot.emit(Event.PAN);
        }

        /**
         * Return whether or not the animation has finished.
         *
         * @returns {boolean} Whether or not the animation has finished.
         */
        isFinished() {
            return this.finished;
        }
    }

    module.exports = PanAnimation;

}());
