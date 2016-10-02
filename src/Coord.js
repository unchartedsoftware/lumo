(function() {

    'use strict';

    // Private Methods

    const hashCoord = function(coord) {
        return `${coord.z}-${coord.x}-${coord.y}`;
    };

    const mod = function(n, m) {
        return ((n % m) + m) % m;
    };

    /**
     * Class representing a tile coordinate.
     */
    class Coord {

        /**
         * Instantiates a new Bounds object.
         *
         * @param {Number} z - The z component of the tile.
         * @param {Number} x - The x component of the tile.
         * @param {Number} y - The y component of the tile.
         */
        constructor(z, x, y) {
            this.z = z;
            this.x = x;
            this.y = y;
            this.hash = hashCoord(this);
        }

        /**
         * Test if the bounds equals another.
         *
         * @param {Coord} coord - The coord object to test.
         *
         * @returns {boolean} Whether or not the coord objects are equal.
         */
        equals(coord) {
            return this.z === coord.z &&
                this.x === coord.x &&
                this.y === coord.y;
        }

        /**
         * Get the ancestor coord.
         *
         * @param {Number} offset - The offset of the ancestor from the coord. Optional.
         *
         * @returns {Coord} The ancestor coord.
         */
        getAncestor(offset = 1) {
            const scale = Math.pow(2, offset);
            return new Coord(
                this.z - offset,
                Math.floor(this.x / scale),
                Math.floor(this.y / scale));
        }

        /**
         * Get the descendants of the coord.
         *
         * @param {Number} offset - The offset of the descendants from the coord. Optional.
         *
         * @returns {Array[Coord]} The array of descendant coords.
         */
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

        /**
         * Test if the coord is an ancestor of the provided coord.
         *
         * @param {Coord} coord - The coord object to test.
         *
         * @returns {boolean} Whether or not the provided coord is an ancestor.
         */
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

        /**
         * Test if the coord is a descendant of the provided coord.
         *
         * @param {Coord} coord - The coord object to test.
         *
         * @returns {boolean} Whether or not the provided coord is a descendant.
         */
        isDescendantOf(parent) {
            return parent.isAncestorOf(this);
        }

        /**
         * Returns the normalized coord.
         *
         * @returns {Coord} The normalized coord.
         */
        normalize() {
            const dim = Math.pow(2, this.z);
            return new Coord(
                this.z,
                mod(this.x, dim),
                mod(this.y, dim));
        }
    }

    module.exports = Coord;

}());
