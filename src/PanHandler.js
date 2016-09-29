(function() {

    'use strict';

    const Const = require('./Const');
    const PanAnimation = require('./PanAnimation');
    const Request = require('./Request');

    // Private Methods

    const pan = function(plot, delta) {
        if (plot.zoomAnimation) {
            // no panning while zooming
            return;
        }
        // update current viewport
        plot.viewport.x -= delta.x;
        plot.viewport.y -= delta.y;
        // update target viewport
        plot.targetViewport.x -= delta.x;
        plot.targetViewport.y -= delta.y;
        // request tiles
        Request.panRequest(plot);
        // emit pan
        plot.emit(Event.PAN, delta);
    };

    // Class / Public Methods

    class PanHandler {
        constructor(plot, options = {}) {

            this.inertia = options.inertia !== undefined ? options.inertia : true;
            this.inertiaEasing = options.inertiaEasing ? options.inertiaEasing : 0.2;
            this.inertiaDeceleration = options.inertiaDeceleration ? options.inertiaDeceleration : 3400;

            let down = false;
            let lastPos = null;
            let lastTime = null;

            let positions = [];
            let times = [];

            plot.canvas.addEventListener('mousedown', event => {
                // flag as down
                down = true;
                // set position and timestamp
                lastPos = plot.mouseToViewPx(event);
                lastTime = Date.now();
                if (this.inertia) {
                    // clear existing pan animation
                    plot.panAnimation = null;
                    // reset position and time arrays
                    positions = [];
                    times = [];
                }
            });

            document.addEventListener('mousemove', event => {
                if (down) {
                    // get latest position and timestamp
                    let pos = plot.mouseToViewPx(event);
                    let time = Date.now();

                    if (this.inertia) {
                        // add to position and time arrays
                        positions.push(pos);
                        times.push(time);
                        // prevent array from getting too big
                        if (time - times[0] > Const.PAN_CANCEL_DELAY) {
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
                    pan(plot, delta);

                    // update last position and time
                    lastTime = time;
                    lastPos = pos;

                    // emit pan
                    plot.emit(Event.PAN, delta);
                }
            });

            document.addEventListener('mouseup', () => {
                // flag as up
                down = false;

                if (!this.inertia) {
                    // exit early if no inertia
                    plot.emit(Event.PAN_END);
                    return;
                }

                // get timestamp
                const time = Date.now();

                // strip any positions that are too old
                while (time - times[0] > Const.PAN_CANCEL_DELAY) {
                    positions.shift();
                    times.shift();
                }

                if (times.length === 0) {
                    // exit early if no remaining positions
                    plot.emit(Event.PAN_END);
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
                    x: plot.viewport.x,
                    y: plot.viewport.y
                };
                if (delta.x !== 0 && delta.y !== 0) {
                    // set pan animation
                    plot.panAnimation = new PanAnimation({
                        start: start,
                        delta: delta,
                        easing: easing,
                        duration: duration * 1000 // back to ms
                    });
                } else {
                    plot.emit(Event.PAN_END);
                }

            });

        }
    }

    module.exports = PanHandler;

}());
