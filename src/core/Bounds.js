'use strict';

/**
 * Class representing a set of bounds.
 */
class Bounds {

	/**
	 * Instantiates a new Bounds object.
	 *
	 * @param {Number} left - The left bound.
	 * @param {Number} right - The right bound.
	 * @param {Number} bottom - The bottom bound.
	 * @param {Number} top - The top bound.
	 */
	constructor(left, right, bottom, top) {
		this.left = left;
		this.right = right;
		this.bottom = bottom;
		this.top = top;
	}

	/**
	 * Get the width of the bounds.
	 *
	 * @returns {Number} The width of the bounds.
	 */
	width() {
		return this.right - this.left;
	}

	/**
	 * Get the height of the bounds.
	 *
	 * @returns {Number} The height of the bounds.
	 */
	height() {
		return this.top - this.bottom;
	}

	/**
	 * Test if the bounds equals another.
	 *
	 * @param {Bounds} bounds - The bounds object to test.
	 *
	 * @returns {boolean} Whether or not the bounds objects are equal.
	 */
	equals(bounds) {
		return this.left === bounds.left &&
			this.right === bounds.right &&
			this.bottom === bounds.bottom &&
			this.top === bounds.top;
	}

	/**
	 * Test if the bounds overlaps another. Test is inclusive of edges.
	 *
	 * @param {Bounds} other - The bounds object to test.
	 *
	 * @returns {boolean} Whether or not the bounds overlap eachother.
	 */
	overlaps(bounds) {
		// NOTE: inclusive of edges
		return !(this.left > bounds.right ||
			this.right < bounds.left ||
			this.top < bounds.bottom ||
			this.bottom > bounds.top);
	}

	/**
	 * Return the intersection of the bounds. Test is inclusive of edges. If
	 * the bounds do not intersect, returns undefined.
	 *
	 * @param {Bounds} other - The bounds object to intersect.
	 *
	 * @returns {Bounds} The intersection of both bounds.
	 */
	intersection(bounds) {
		// NOTE: inclusive of edges
		if (!this.overlaps(bounds)) {
			return undefined;
		}
		return new Bounds(
			Math.max(this.left, bounds.left),
			Math.min(this.right, bounds.right),
			Math.max(this.bottom, bounds.bottom),
			Math.min(this.top, bounds.top));
	}
}

module.exports = Bounds;
