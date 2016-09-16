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
                spec.pos ? Math.round(spec.pos[0]) : 0,
                spec.pos ? Math.round(spec.pos[1]) : 0);
            this.width = spec.width ? Math.round(spec.width) : 0;
            this.height = spec.height ? Math.round(spec.height) : 0;
        }
        getPixelBounds() {
            // NOTE: bounds are INCLUSIVE
            return new Bounds(
                this.pos[0],
                this.pos[0] + this.width - 1,
                this.pos[1],
                this.pos[1] + this.height - 1);
        }
        getTileBounds(tileSize, viewportZoom, tileZoom = viewportZoom) {
            // NOTE: bounds are INCLUSIVE
            // get the tile coordinate bounds for tiles from the tileZoom that
            // are visible from the viewportZoom.
            //     Ex. if current viewport zoom is 3 and tile zoom is 5, the
            //         tiles will be 25% of there normal size compared to the
            //         viewport.
            const scale = Math.pow(2, viewportZoom - tileZoom);
            const dim = Math.pow(2, tileZoom);
            const scaledTileSize = tileSize * scale;
            // TODO: add wrap-around logic
            return new Bounds(
                Math.max(0, Math.floor(this.pos[0] / scaledTileSize)),
                Math.min(dim - 1, Math.ceil(((this.pos[0] + this.width) / scaledTileSize) - 1)),
                Math.max(0, Math.floor(this.pos[1] / scaledTileSize)),
                Math.min(dim - 1, Math.ceil(((this.pos[1] + this.height) / scaledTileSize) - 1)));
        }
        getVisibleCoords(tileSize, zoom) {
            const bounds = this.getTileBounds(tileSize, zoom);
            // TODO: pre-allocate this and index
            let coords = [];
            for (let x=bounds.left; x<=bounds.right; x++) {
                for (let y=bounds.bottom; y<=bounds.top; y++) {
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
