(function() {

    'use strict';

    const defaultTo = require('lodash/defaultTo');
    const PanAnimation = require('./PanAnimation');
    const Request = require('./Request');

    // Constants

    /**
     * Time in milliseconds before a pan point expires.
     * @constant {Number}
     */
    const PAN_EXPIRY_MS = 50;

    /**
     * Pan inertia enabled.
     * @constant {boolean}
     */
    const PAN_INTERTIA = true;

    /**
     * Pan inertia easing.
     * @constant {Number}
     */
    const PAN_INTERTIA_EASING = 0.2;

    /**
     * Pan inertia deceleration.
     * @constant {Number}
     */
    const PAN_INTERTIA_DECELERATION = 3400;

    // Private Methods

    const pan = function(plot, delta) {
        if (plot.zoomAnimation) {
            // no panning while zooming
            return;
        }
        // update current viewport
        plot.viewport.x -= delta.x;
        plot.viewport.y -= delta.y;
        // request tiles
        Request.panRequest(plot);
        // emit pan
        plot.emit(Event.PAN, delta);
    };

    /**
     * Class representing a pan handler.
     */
    class PanHandler {

        /**
         * Instantiates a new PanHandler object.
         *
         * @param {Plot} plot - The plot to attach the handler to.
         * @param {Object} options - The parameters of the animation.
         * @param {Number} options.inertia - Whether or not pan inertia is enabled.
         * @param {Number} options.inertiaEasing - The inertia easing factor.
         * @param {Number} options.inertiaDeceleration - The inertia deceleration factor.
         */
        constructor(plot, options = {}) {
            this.inertia = defaultTo(options.inertia, PAN_INTERTIA);
            this.inertiaEasing = defaultTo(options.inertiaEasing, PAN_INTERTIA_EASING);
            this.inertiaDeceleration = defaultTo(options.inertiaDeceleration, PAN_INTERTIA_DECELERATION);
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

            let down = false;
            let lastPos = null;
            let lastTime = null;
            let positions = [];
            let times = [];

            this.mousedown = (event) => {
                // flag as down
                down = true;
                // set position and timestamp
                lastPos = this.plot.mouseToViewPx(event);
                lastTime = Date.now();
                if (this.inertia) {
                    // clear existing pan animation
                    this.plot.panAnimation = null;
                    // reset position and time arrays
                    positions = [];
                    times = [];
                }
            };

            this.mousemove = (event) => {
                if (down) {
                    // get latest position and timestamp
                    let pos = this.plot.mouseToViewPx(event);
                    let time = Date.now();

                    if (this.inertia) {
                        // add to position and time arrays
                        positions.push(pos);
                        times.push(time);
                        // prevent array from getting too big
                        if (time - times[0] > PAN_EXPIRY_MS) {
                            positions.shift();
                            times.shift();
                        }
                    }

                    // calculate the positional delta
                    const delta = {
                        x: pos.x - lastPos.x,
                        y: pos.y - lastPos.y
                    };
                    // pan the plot
                    pan(this.plot, delta);
                    // update last position and time
                    lastTime = time;
                    lastPos = pos;
                    // emit pan
                    this.plot.emit(Event.PAN, delta);
                }
            };

            this.mouseup = () => {
                // flag as up
                down = false;

                if (!this.inertia) {
                    // exit early if no inertia
                    this.plot.emit(Event.PAN_END);
                    return;
                }

                // get timestamp
                const time = Date.now();

                // strip any positions that are too old
                while (time - times[0] > PAN_EXPIRY_MS) {
                    positions.shift();
                    times.shift();
                }

                if (times.length < 2) {
                    // exit early if no remaining positions
                    this.plot.emit(Event.PAN_END);
                    return;
                }

                // shorthand
                const deceleration = this.inertiaDeceleration;
                const easing = this.inertiaEasing;

                // calculate direction from earliest to latest
                const direction = {
                    x: lastPos.x - positions[0].x,
                    y: lastPos.y - positions[0].y
                };
                // calculate the time difference
                const diff = (lastTime - times[0]) / 1000;
                // calculate velocity
                const velocity = {
                    x: direction.x * (easing / diff),
                    y: direction.y * (easing / diff)
                };
                // calculate speed
                const speed = Math.sqrt(
                    (velocity.x * velocity.x) +
                    (velocity.y * velocity.y));
                // calculate panning duration
                const duration = speed / (deceleration * easing);
                // calculate inertia delta
                const delta = {
                    x: Math.round(velocity.x * (-duration / 2)),
                    y: Math.round(velocity.y * (-duration / 2))
                };
                // get current viewport x / y
                const start = {
                    x: this.plot.viewport.x,
                    y: this.plot.viewport.y
                };
                if (delta.x !== 0 && delta.y !== 0) {
                    // set pan animation
                    this.plot.panAnimation = new PanAnimation({
                        start: start,
                        delta: delta,
                        easing: easing,
                        duration: duration * 1000 // back to ms
                    });
                } else {
                    this.plot.emit(Event.PAN_END);
                }
            };

            this.plot.container.addEventListener('mousedown', this.mousedown);
            document.addEventListener('mousemove', this.mousemove);
            document.addEventListener('mouseup', this.mouseup);
            this.enabled = true;
        }

        /**
         * Disables the handler.
         *
         * @returns {PanHandler} The handler object, for chaining.
         */
        disable() {
            if (!this.enabled) {
                throw 'Handler is already disabled';
            }
            this.plot.container.removeEventListener('mousedown', this.mousedown);
            document.removeEventListener('mousemove', this.mousemove);
            document.removeEventListener('mouseup', this.mouseup);
            this.mousedown = null;
            this.mousemove = null;
            this.mouseup = null;
            this.enabled = false;
        }
    }

    module.exports = PanHandler;

}());
