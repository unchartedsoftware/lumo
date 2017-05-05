'use strict';

// Constants

const INSIDE = 0x00; // 0000
const LEFT = 0x01;   // 0001
const RIGHT = 0x02;  // 0010
const BOTTOM = 0x04; // 0100
const TOP = 0x08;    // 1000

function computeCode(bounds, x, y) {
	let code = INSIDE;
	if (x < bounds.left) {
		// to the left of clip window
		code |= LEFT;
	} else if (x > bounds.right) {
		// to the right of clip window
		code |= RIGHT;
	}
	if (y < bounds.bottom) {
		// below the clip window
		code |= BOTTOM;
	} else if (y > bounds.top) {
		// above the clip window
		code |= TOP;
	}
	return code;
}

function cohenSutherlandClip(bounds, a, b) {
	// Cohen–Sutherland clipping algorithm clips a line against a rectangle.

	// copy so we don't change in-place
	let ax = a.x;
	let ay = a.y;
	let bx = b.x;
	let by = b.y;

	// compute outcodes for P0, P1, and whatever point lies outside the clip rectangle
	let aCode = computeCode(bounds, ax, ay);
	let bCode = computeCode(bounds, bx, by);
	let accept = false;

	let aClipped = false;
	let bClipped = false;

	const MAX_ITERATIONS = 8;
	let iter = 0;
	while (iter < MAX_ITERATIONS) {
		if (!(aCode | bCode)) {
			// bitwise OR is 0. Trivially accept and get out of loop
			accept = true;
			break;

		} else if (aCode & bCode) {
			// bitwise AND is not 0. (implies both end points are in the same
			// region outside the window). Reject and get out of loop
			break;

		} else {
			// failed both tests, so calculate the line segment to clip
			// from an outside point to an intersection with clip edge
			let x, y;

			// At least one endpoint is outside the clip rectangle; pick it.
			const code = aCode ? aCode : bCode;

			// Now find the intersection point;
			// use formulas
			// y = ay + slope * (x - ax), x = ax + (1 / slope) * (y - ay)

			if (code & TOP) {
				// point is above the clip rectangle
				x = ax + (bx - ax) * (bounds.top - ay) / (by - ay);
				y = bounds.top;
			} else if (code & BOTTOM) {
				// point is below the clip rectangle
				x = ax + (bx - ax) * (bounds.bottom - ay) / (by - ay);
				y = bounds.bottom;
			} else if (code & RIGHT) {
				// point is to the right of clip rectangle
				y = ay + (by - ay) * (bounds.right - ax) / (bx - ax);
				x = bounds.right;
			} else if (code & LEFT) {
				// point is to the left of clip rectangle
				y = ay + (by - ay) * (bounds.left - ax) / (bx - ax);
				x = bounds.left;
			}

			// now we move outside point to intersection point to clip
			// and get ready for next pass.
			if (code === aCode) {
				ax = x;
				ay = y;
				aCode = computeCode(bounds, ax, ay);
				aClipped = true;
			} else {
				bx = x;
				by = y;
				bCode = computeCode(bounds, bx, by);
				bClipped = true;
			}
		}
		iter++;
	}
	if (accept) {
		return {
			a: { x: ax, y: ay, clipped: aClipped },
			b: { x: bx, y: by, clipped: bClipped }
		};
	}
	return null;
}

/**
 * Class representing a set of bounds.
 */
class Bounds {

	/**
	 * Instantiates a new Bounds object.
	 *
	 * @param {number} left - The left bound.
	 * @param {number} right - The right bound.
	 * @param {number} bottom - The bottom bound.
	 * @param {number} top - The top bound.
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
	 * @returns {number} The width of the bounds.
	 */
	getWidth() {
		return this.right - this.left;
	}

	/**
	 * Get the height of the bounds.
	 *
	 * @returns {number} The height of the bounds.
	 */
	getHeight() {
		return this.top - this.bottom;
	}

	/**
	 * Extends the bounds by the provided point or bounds object.
	 *
	 * @param {Object|Bounds} arg - The point or bounds to extend the bounds by.
	 *
	 * @returns {Bounds} The bounds object, for chaining.
	 */
	extend(arg) {
		if (arg.left !== undefined &&
			arg.right !== undefined &&
			arg.bottom !== undefined &&
			arg.top !== undefined) {
			// bounds
			if (arg.left < this.left) {
				this.left = arg.left;
			}
			if (arg.right > this.right) {
				this.right = arg.right;
			}
			if (arg.bottom < this.bottom) {
				this.bottom = arg.bottom;
			}
			if (arg.top > this.top) {
				this.top = arg.top;
			}
		} else {
			// point
			if (arg.x < this.left) {
				this.left = arg.x;
			}
			if (arg.x > this.right) {
				this.right = arg.x;
			}
			if (arg.y < this.bottom) {
				this.bottom = arg.y;
			}
			if (arg.y > this.top) {
				this.top = arg.y;
			}
		}
	}

	/**
	 * Get the center coordinate of the bounds.
	 *
	 * @returns {Object} The center coordinate of the bounds.
	 */
	getCenter() {
		return {
			x: this.left + (this.getWidth() / 2),
			y: this.bottom + (this.getHeight() / 2)
		};
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
	 * @param {Bounds} bounds - The bounds object to test.
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
	 * @param {Bounds} bounds - The bounds object to intersect.
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

	/**
	 * Clips the provided line segment to within the dimensions of the bounds.
	 *
	 * @param {Object} a - The src point of the line segment.
	 * @param {Object} b - The dst point of the line segment.
	 *
	 * @returns {Object} The clipped line and flags to whether or not they were clipped.
	 */
	clipLine(a, b) {
		return cohenSutherlandClip(this, a, b);
	}

	/**
	 * Clips the provided points to those within the dimensions of the bounds.
	 *
	 * @param {Array} points - The points to clip.
	 *
	 * @returns {Array} The clipped points.
	 */
	clipPoints(points) {
		const clipped = [];
		for (let i=0; i<points.length; i++) {
			const point = points[i];
			if (point.x >= this.left &&
				point.x <= this.right &&
				point.y >= this.bottom &&
				point.y <= this.top) {
				clipped.push(point);
			}
		}
		return clipped;
	}
}

module.exports = Bounds;
