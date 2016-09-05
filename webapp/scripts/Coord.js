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
        getParent(offset = 1) {
            const scale = Math.pow(2, offset);
            return new Coord(
                this.z - offset,
                Math.floor(this.x / scale),
                Math.floor(this.y / scale));
        }
        getChildren(offset = 1) {
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
        getSiblings() {
            const parent = this.getParent();
            return parent.getChildren();
        }
        isInView(tileSize, zoom, viewport, viewportPx) {
            const scale = Math.pow(2, zoom - this.z);
            const scaledTileSize = tileSize * scale;
            const viewportBounds = new Bounds(
                viewportPx[0],
                viewportPx[0] + viewport[0],
                viewportPx[1],
                viewportPx[1] + viewport[1]);
            const tileBounds = new Bounds(
                this.x * scaledTileSize,
                this.x * scaledTileSize + scaledTileSize,
                this.y * scaledTileSize,
                this.x * scaledTileSize + scaledTileSize);
            return viewportBounds.overlaps(tileBounds);
        }
    }

    module.exports = Coord;

}());
