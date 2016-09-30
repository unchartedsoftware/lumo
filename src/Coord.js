(function() {

    'use strict';

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
        isAncestorOf(child) {
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
        isDescendantOf(parent) {
            return parent.isAncestorOf(this);
        }
    }

    module.exports = Coord;

}());
