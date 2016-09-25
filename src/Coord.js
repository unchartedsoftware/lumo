(function() {

    'use strict';

    const Bounds = require('./Bounds');

    // Private Methods

    const hashCoord = function(coord) {
        return `${coord.z}-${coord.x}-${coord.y}`;
    };

    // Class / Public Methods

    class Coord {
        constructor(z, x, y) {
            this.z = z;
            this.x = x;
            this.y = y;
            this.hash = hashCoord(this);
        }
        equals(other) {
            return this.z === other.z &&
                this.x === other.x &&
                this.y === other.y;
        }
        getAncestor(offset = 1) {
            const scale = Math.pow(2, offset);
            return new Coord(
                this.z - offset,
                Math.floor(this.x / scale),
                Math.floor(this.y / scale));
        }
        getDescendants(offset = 1) {
            const scale = Math.pow(2, offset);
            const coords = [];
            for (let x=0; x<scale; x++) {
                for (let y=0; y<scale; y++) {
                    coords.push(new Coord(
                        this.z + offset,
                        this.x * scale + x,
                        this.y * scale + y));
                }
            }
            return coords;
        }
        isParentOf(child) {
            if (this.z >= child.z) {
                return false;
            }
            const diff = child.z - this.z;
            const scale = Math.pow(2, diff);
            const x = Math.floor(child.x / scale);
            if (this.x !== x) {
                return false;
            }
            const y = Math.floor(child.y / scale);
            return this.y === y;
        }
        isChildOf(parent) {
            return parent.isParentOf(this);
        }
        getPixelBounds(tileSize, viewportZoom = this.z) {
            // NOTE: bounds are INCLUSIVE
            // scale the pixel bounds depending on the viewportZoom
            const scale = Math.pow(2, viewportZoom - this.z);
            const scaledTileSize = tileSize * scale;
            const scaledX = this.x * scaledTileSize;
            const scaledY = this.y * scaledTileSize;
            return new Bounds(
                Math.round(scaledX),
                Math.round(scaledX + scaledTileSize - 1),
                Math.round(scaledY),
                Math.round(scaledY + scaledTileSize - 1));
        }
        getDescendantTileBounds(descendantZoom) {
            // NOTE: bounds are INCLUSIVE
            if (!Number.isInteger(descendantZoom)) {
                throw `Zoom parameter of ${descendantZoom} is not an integer`;
            }
            if (descendantZoom <= this.z) {
                throw `Zoom parameter is greater than Coord.z of ${this.z}`;
            }
            const scale = Math.pow(2, descendantZoom - this.z);
            const scaledX = this.x * scale;
            const scaledY = this.y * scale;
            return new Bounds(
                scaledX,
                scaledX + scale - 1,
                scaledY,
                scaledY + scale - 1);
        }
        isInView(tileSize, zoom, viewport) {
            const viewportBounds = viewport.getPixelBounds(zoom);
            const tileBounds = this.getPixelBounds(tileSize, zoom);
            return viewportBounds.overlaps(tileBounds);
        }
    }

    module.exports = Coord;

}());
