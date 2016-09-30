(function() {

    'use strict';

    // Class / Public Methods

    class Bounds {
        constructor(left, right, bottom, top) {
            this.left = left;
            this.right = right;
            this.bottom = bottom;
            this.top = top;
        }
        width() {
            return this.right - this.left;
        }
        height() {
            return this.top - this.bottom;
        }
        equals(other) {
            return this.left === other.left &&
                this.right === other.right &&
                this.bottom === other.bottom &&
                this.top === other.top;
        }
        overlaps(bounds) {
            // NOTE: inclusive of edges
            return !(this.left > bounds.right ||
                this.right < bounds.left ||
                this.top < bounds.bottom ||
                this.bottom > bounds.top);
        }
        intersection(bounds) {
            // NOTE: inclusive of edges
            if (!this.overlaps(bounds)) {
                return null;
            }
            return new Bounds(
                Math.max(this.left, bounds.left),
                Math.min(this.right, bounds.right),
                Math.max(this.bottom, bounds.bottom),
                Math.min(this.top, bounds.top));
        }
    }

    module.exports = Bounds;

}());
