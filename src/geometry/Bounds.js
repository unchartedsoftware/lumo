'use strict';

// Constants

const INSIDE = 0x00; // 0000
const LEFT = 0x01;   // 0001
const RIGHT = 0x02;  // 0010
const BOTTOM = 0x04; // 0100
const TOP = 0x08;    // 1000

const computeCode = function(bounds, x, y) {
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
};

const sutherlandHodgemanClip = function(bounds, points) {
	// Sutherland-Hodgeman clipping algorithm clips a polygon against a
	// rectangle.

	let result;
	for (let code=1; code<=8; code*=2) {
		result = [];
		let prev = points[points.length - 1];
		let prevInside = !(computeCode(bounds, prev.x, prev.y) & code);
		for (let i=0; i<points.length; i++) {
			const p = points[i];
			const inside = !(computeCode(bounds, p.x, p.y) & code);
			// if segment goes through the clip window, add an intersection
			if (inside !== prevInside) {
				const ax = prev.x;
				const ay = prev.y;
				const bx = p.x;
				const by = p.y;
				let x, y = 0;
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
				} else { //if (code & LEFT) {
					// point is to the left of clip rectangle
					y = ay + (by - ay) * (bounds.left - ax) / (bx - ax);
					x = bounds.left;
				}
				result.push({
					x: x,
					y: y
				});
			}
			if (inside) {
				// add a point if it's inside
				result.push(p);
			}
			prev = p;
			prevInside = inside;
		}
		points = result;
		if (!points.length) {
			break;
		}
	}
	return result.length > 0 ? result : null;
};

const cohenSutherlandClip = function(bounds, a, b) {
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
	// normal alg has infiinite while loop, cap at 8 iterations just in case
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
			let x, y = 0;
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
			} else { //if (code & LEFT) {
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
			} else {
				bx = x;
				by = y;
				bCode = computeCode(bounds, bx, by);
			}
		}
		iter++;
	}
	if (accept) {
		return [
			{ x: ax, y: ay },
			{ x: bx, y: by }
		];
	}
	return null;
};

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
	 * Test is inclusive of edges.
	 *
	 * @param {Array} line - The line.
	 *
	 * @returns {Array} The clipped line, or null if it is outside the bounds.
	 */
	clipLine(line) {
		if (!line || line.length !== 2) {
			return null;
		}
		return cohenSutherlandClip(this, line[0], line[1]);
	}

	/**
	 * Clips the provided polyline to within the dimensions of the bounds. Will
	 * return an array of clipped polylines as result.
	 * Test is inclusive of edges.
	 *
	 * @param {Array} polyline - The polyline.
	 *
	 * @returns {Array} The resulting clipped polylines, or null if it is outside the bounds.
	 */
	clipPolyline(polyline) {
		if (!polyline || polyline.length < 2) {
			return null;
		}
		const clipped = [];
		let current = [];
		for (let i=1; i<polyline.length; i++) {
			const a = polyline[i-1];
			const b = polyline[i];
			// clip the line
			const line = cohenSutherlandClip(this, a, b);
			// no line in bounds
			if (!line) {
				continue;
			}
			const clippedA = line[0];
			const clippedB = line[1];
			// add src point
			current.push(clippedA);
			if ((clippedB.x !== b.x && clippedB.y !== b.y) ||
				i === polyline.length - 1) {
				// only add destination point if it was clipped, or is last
				// point
				current.push(clippedB);
				// then break the polyline
				clipped.push(current);
				current = [];
			}
		}
		return clipped.length > 0 ? clipped : null;
	}

	/**
	 * Clips the provided points to those within the dimensions of the bounds.
	 * Test is inclusive of edges.
	 *
	 * @param {Array} points - The points to clip.
	 *
	 * @returns {Array} The clipped points, or null if none are within the bounds.
	 */
	clipPoints(points) {
		if (!points) {
			return null;
		}
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
		return clipped.length > 0 ? clipped : null;
	}

	/**
	 * Clips the provided polygon to those within the dimensions of the bounds.
	 * Test is inclusive of edges.
	 *
	 * @param {Array} polygon - The points of the polygon to clip.
	 *
	 * @returns {Array} The clipped points of the polygon, or null if it is not within the bounds.
	 */
	clipPolygon(polygon) {
		if (!polygon || polygon.length < 3) {
			return null;
		}
		return sutherlandHodgemanClip(this, polygon);
	}
}

module.exports = Bounds;
