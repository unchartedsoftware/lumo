(function() {

    'use strict';

    const EventEmitter = require('events');
    const Bounds = require('./Bounds');
    const Coord = require('./Coord');

    // Class / Public Methods

    class Viewport extends EventEmitter {
        constructor(spec = {}) {
            super();
            this.x = spec.x ? Math.round(spec.x) : 0;
            this.y = spec.y ? Math.round(spec.y) : 0;
            this.width = spec.width ? Math.round(spec.width) : 0;
            this.height = spec.height ? Math.round(spec.height) : 0;
        }
        getPixelBounds() {
            // NOTE: bounds are INCLUSIVE
            return new Bounds(
                this.x,
                this.x + this.width - 1,
                this.y,
                this.y + this.height - 1);
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
                Math.max(0, Math.floor(this.x / scaledTileSize)),
                Math.min(dim - 1, Math.ceil(((this.x + this.width) / scaledTileSize) - 1)),
                Math.max(0, Math.floor(this.y / scaledTileSize)),
                Math.min(dim - 1, Math.ceil(((this.y + this.height) / scaledTileSize) - 1)));
        }
        getVisibleCoords(tileSize, viewportZoom, tileZoom = viewportZoom) {
            const bounds = this.getTileBounds(tileSize, viewportZoom, tileZoom);
            // TODO: pre-allocate this and index
            let coords = [];
            for (let x=bounds.left; x<=bounds.right; x++) {
                for (let y=bounds.bottom; y<=bounds.top; y++) {
                    coords.push(new Coord(tileZoom, x, y));
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
            const viewport = new Viewport({
                width: this.width,
                height: this.height,
                x: this.x + change,
                y: this.y + change
            });
            return viewport;
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
            const diff = {
                x: targetPx.x - half,
                y: targetPx.y - half
            };
            // get the scaling between the two zoom levels
            const scale = Math.pow(2, targetZoom - zoom);
            // scale the diff, and subtract it's current value
            const scaledDiff = {
                x: diff.x * scale - diff.x,
                y: diff.y * scale - diff.y
            };
            // return new viewport
            const viewport = new Viewport({
                width: this.width,
                height: this.height,
                x: this.x + change + scaledDiff.x,
                y: this.y + change + scaledDiff.y
            });
            return viewport;
        }
    }

    module.exports = Viewport;

}());
