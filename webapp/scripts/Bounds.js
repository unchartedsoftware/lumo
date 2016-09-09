(function() {

    'use strict';

    // Private Methods

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
        overlaps(bounds) {
            return !(this.left > bounds.right ||
                this.right < bounds.left ||
                this.top < bounds.bottom ||
                this.bottom > bounds.top);
        }
        union(bounds) {
            return new Bounds(
                Math.min(this.left, bounds.left),
                Math.max(this.right, bounds.right),
                Math.min(this.bottom, bounds.bottom),
                Math.max(this.top, bounds.top));
        }
        intersection(bounds) {
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
