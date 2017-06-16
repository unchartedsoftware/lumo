'use strict';

/**
 * Class representing a circle collidable.
 */
class CircleCollidable {

	/**
	 * Instantiates a new CircleCollidable object.
	 *
	 * @param {number} x - The tile x pixel coordinate.
	 * @param {number} y - The tile y pixel coordinate.
	 * @param {number} radius - The radius in pixels.
	 * @param {number} radiusBuffer - The radius buffer in pixels (additional hit-area beyond radius)
	 * @param {number} xOffset - The tile x offset in pixels.
	 * @param {number} yOffset - The tile y offset in pixels.
	 * @param {Tile} tile - The tile object.
	 * @param {Object} data - Any arbitrary user data.
	 * @param {bool} includeArea - whether to include the area of the circle in the hit-testing (default true)
	 */
	constructor(x, y, radius, radiusBuffer, xOffset, yOffset, tile, data, includeArea) {

		this.x = x;
		this.y = y;
		this.radius = radius;
		this.radiusBuffer = radiusBuffer;
		this.minX = x + xOffset - radius;
		this.maxX = x + xOffset + radius;
		this.minY = y + yOffset - radius;
		this.maxY = y + yOffset + radius;
		this.tile = tile;
		this.data = data;
		this.includeArea = includeArea === undefined ? true : includeArea;
	}

	/**
	 * Test if the provided position is within the inner shape of the collidable.
	 *
	 * @param {number} x - The x position to test.
	 * @param {number} y - The y position to test.
	 *
	 * @returns {bool} Whether or not there is an intersection.
	 */
	testPoint(x, y) {
		if (this.includeArea) {
			return this._testPointInArea(x, y);
		} else {
			return this._testPointOnPerimeter(x, y);
		}
	}

	/**
	 * Test if the provided position is within the buffered inner shape of the collidable.
	 *
	 * @param {number} x - The x position to test.
	 * @param {number} y - The y position to test.
	 *
	 * @returns {bool} Whether or not there is an intersection.
	 */
	_testPointInArea(x, y) {
		// center pos
		const cx = (this.minX + this.maxX) * 0.5;
		const cy = (this.minY + this.maxY) * 0.5;
		// distance to point
		const dx = cx - x;
		const dy = cy - y;
		const bufferedRadius = this.radius + this.radiusBuffer;
		return (dx * dx + dy * dy) <= (bufferedRadius * bufferedRadius);
	}

	/**
	 * Test if the provided position is within the buffered ring shape of the collidable.
	 *
	 * @param {number} x - The x position to test.
	 * @param {number} y - The y position to test.
	 *
	 * @returns {bool} Whether or not there is an intersection.
	 */
	_testPointOnPerimeter(x, y) {
		// center pos
		const cx = (this.minX + this.maxX) * 0.5;
		const cy = (this.minY + this.maxY) * 0.5;
		// distance to point
		const dx = cx - x;
		const dy = cy - y;
		const distance = dx * dx + dy * dy;

		const innerRadius = this.radius - this.radiusBuffer;
		const outerRadius = this.radius + this.radiusBuffer;

		return (distance <= (outerRadius * outerRadius)) && (distance >= (innerRadius * innerRadius));
	}

	/**
	 * Test if the provided rectangle is within the inner shape of the
	 * collidable.
	 *
	 * @param {number} minX - The minimum x component.
	 * @param {number} maxX - The maximum x component.
	 * @param {number} minY - The minimum y component.
	 * @param {number} maxY - The maximum y component.
	 *
	 * @returns {bool} Whether or not there is an intersection.
	 */
	testRectangle(minX, maxX, minY, maxY) {
		// rectangle half sizes
		const halfWidth = (minX + maxX) * 0.5;
		const halfHeight = (minY + maxY) * 0.5;
			// center pos
		const cx = (this.minX + this.maxX) * 0.5;
		const cy = (this.minY + this.maxY) * 0.5;
		// distance from rectangle bottom-left
		const dx = Math.abs(cx - minX);
		const dy = Math.abs(cy - minY);
		// assume the boxes are squares
		if ((dx > (halfWidth + this.radius)) ||
			(dy > (halfHeight + this.radius))) {
			return false;
		}
		if ((dx <= halfWidth) || (dy <= halfHeight)) {
			return true;
		}
		const cornerDist =
			Math.pow(2, dx - halfWidth) +
			Math.pow(2, dy - halfHeight);
		return cornerDist <= (this.radius * this.radius);
	}
}

module.exports = CircleCollidable;
