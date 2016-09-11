(function() {

    'use strict';

    const EventEmitter = require('events');
    const glm = require('gl-matrix');
    const Bounds = require('./Bounds');
    const Coord = require('./Coord');

    // Class / Public Methods

    class Viewport extends EventEmitter {
        constructor(spec = {}) {
            super();
            this.pos = glm.vec2.fromValues(
                spec.pos ? spec.pos[0] : 0,
                spec.pos ? spec.pos[1] : 0);
            this.width = spec.width;
            this.height = spec.height;
        }
        getBounds() {
            return new Bounds(
                this.pos[0],
                this.pos[0] + this.width,
                this.pos[1],
                this.pos[1] + this.height);
        }
        getTileBounds(tileSize, zoom) {
            const dim = Math.pow(2, zoom);
            // TODO: add wrap-around logic here
            return new Bounds(
                Math.floor(Math.max(0, this.pos[0] / tileSize)),
                Math.ceil(Math.min(dim, (this.pos[0] + this.width) / tileSize)),
                Math.floor(Math.max(0, this.pos[1] / tileSize)),
                Math.ceil(Math.min(dim, (this.pos[1] + this.height) / tileSize)));
        }
        getVisibleCoords(tileSize, zoom) {
            const bounds = this.getTileBounds(tileSize, zoom);
            // TODO: pre-allocate this and index
            let coords = [];
            for (let x=bounds.left; x<bounds.right; x++) {
                for (let y=bounds.bottom; y<bounds.top; y++) {
                    coords.push(new Coord(zoom, x, y));
                }
            }
            return coords;
        }
        zoomFromPlotCenter(tileSize, zoom, targetZoom) {
            // get the current dimension
            const current = Math.pow(2, zoom);
            // get the next dimension
            const next = Math.pow(2, targetZoom);
            // determine the change in pixels to center the existing plot
            const change = tileSize * (next - current) / 2;
            // return new viewport
            return new Viewport({
                width: this.width,
                height: this.height,
                pos: glm.vec2.fromValues(
                    this.pos[0] + change,
                    this.pos[1] + change)
            });
        }
        zoomFromPlotPx(tileSize, zoom, targetZoom, targetPx) {
            // get the current dimension
            const current = Math.pow(2, zoom);
            // get the next dimension
            const next = Math.pow(2, targetZoom);
            // determine the change in pixels to center the existing plot
            const change = tileSize * (next - current) / 2;
            // get the half size of the plot at the current zoom
            const half = tileSize * current / 2;
            // get the distance from the plot center at the current zoom
            const diff = glm.vec2.fromValues(
                targetPx[0] - half,
                targetPx[1] - half);
            // get the scaling between the two zoom levels
            const scale = Math.pow(2, targetZoom - zoom);
            // scale the diff, and subtract it's current value
            const scaledDiff = glm.vec2.fromValues(
                diff[0] * scale - diff[0],
                diff[1] * scale - diff[1]);
            // return new viewport
            return new Viewport({
                width: this.width,
                height: this.height,
                pos: glm.vec2.fromValues(
                    this.pos[0] + change + scaledDiff[0],
                    this.pos[1] + change + scaledDiff[1])
            });
        }
    }

    module.exports = Viewport;

}());
