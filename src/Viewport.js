(function() {

    'use strict';

    const EventEmitter = require('events');
    const Bounds = require('./Bounds');
    const Coord = require('./Coord');

    /**
     * Class representing a viewport.
     */
    class Viewport extends EventEmitter {

        /**
         * Instantiates a new Viewport object.
         *
         * @param {Object} params - The viewport parameters.
         * @param {Number} params.x - The x coordinate of the viewport.
         * @param {Number} params.y - The y coordinate of the viewport.
         * @param {Number} params.width - The width of the viewport.
         * @param {Number} params.height - The height of the viewport.
         */
        constructor(params = {}) {
            super();
            this.x = params.x ? params.x : 0;
            this.y = params.y ? params.y : 0;
            this.width = params.width ? Math.round(params.width) : 0;
            this.height = params.height ? Math.round(params.height) : 0;
        }

        /**
         * Returns the pixel bounds of the viewport. Bounds edges are inclusive.
         *
         * @returns {Bounds} The pixel bounds of the viewport.
         */
        getPixelBounds() {
            // NOTE: bounds are INCLUSIVE
            return new Bounds(
                this.x,
                this.x + this.width - 1,
                this.y,
                this.y + this.height - 1);
        }

        /**
         * Returns the pixel bounds of the viewport. Bounds edges are inclusive.
         *
         * @param {Number} tileSize - The dimension in pixels of the tiles.
         * @param {Number} viewportZoom - The zoom of the viewport.
         * @param {Number} tileZoom - The zoom of the tiles within the viewport. Optional.
         *
         * @returns {Bounds} The tile bounds of the viewport.
         */
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

        /**
         * Returns the coordinates that are visible in the viewport.
         *
         * @param {Number} tileSize - The dimension in pixels of the tiles.
         * @param {Number} viewportZoom - The zoom of the viewport.
         * @param {Number} tileZoom - The zoom of the tiles within the viewport. Optional.
         *
         * @returns {Array[Coord]} The array of visible tile coords.
         */
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

        /**
         * Returns a viewport that has been zoomed around it's center.
         *
         * @param {Number} tileSize - The dimension in pixels of the tiles.
         * @param {Number} zoom - The current zoom of the viewport.
         * @param {Number} targetZoom - The target zoom of the viewport.
         *
         * @returns {Array[Coord]} The array of visible tile coords.
         */
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

        /**
         * Returns a viewport that has been zoomed around a provided plot pixel.
         *
         * @param {Number} tileSize - The dimension in pixels of the tiles.
         * @param {Number} zoom - The current zoom of the viewport.
         * @param {Number} targetZoom - The target zoom of the viewport.
         * @param {Object} targetPx - The target pixel to zoom around.
         *
         * @returns {Array[Coord]} The array of visible tile coords.
         */
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
