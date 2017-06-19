'use strict';

const clamp = require('lodash/clamp');

/**
 * Class representing a circle collidable.
 */
class RingCollidable {

	/**
	 * Instantiates a new RingCollidable object.
	 *
	 * @param {number} x - The tile x pixel coordinate.
	 * @param {number} y - The tile y pixel coordinate.
	 * @param {number} radius - The radius in pixels.
	 * @param {number} width - The radius buffer in pixels (additional hit-area beyond radius)
	 * @param {number} xOffset - The tile x offset in pixels.
	 * @param {number} yOffset - The tile y offset in pixels.
	 * @param {Tile} tile - The tile object.
	 * @param {Object} data - Any arbitrary user data.
	 */
	constructor(x, y, radius, width, xOffset, yOffset, tile, data) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.width = width;
		const halfWidth = width * 0.5;
		this.minX = x + xOffset - radius - halfWidth;
		this.maxX = x + xOffset + radius + halfWidth;
		this.minY = y + yOffset - radius - halfWidth;
		this.maxY = y + yOffset + radius + halfWidth;
		this.tile = tile;
		this.data = data;
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
		// center pos
		const cx = (this.minX + this.maxX) * 0.5;
		const cy = (this.minY + this.maxY) * 0.5;
		// distance to point
		const dx = cx - x;
		const dy = cy - y;
		const distanceSqr = dx * dx + dy * dy;
		const halfWidth = this.width * 0.5;
		const innerRadius = this.radius - halfWidth;
		const outerRadius = this.radius + halfWidth;
		return (distanceSqr <= (outerRadius * outerRadius)) &&
			(distanceSqr >= (innerRadius * innerRadius));
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
		// circle pos
		const cx = (this.minX + this.maxX) * 0.5;
		const cy = (this.minY + this.maxY) * 0.5;
		// find the furthest points on rectangle from the circle
		let furthestX, furthestY = 0;
		if (Math.abs(cx - minX) < Math.abs(cx - maxX)) {
			furthestX = maxX;
		} else {
			furthestX = minX;
		}
		if (Math.abs(cy - minY) < Math.abs(cy - maxY)) {
			furthestY = maxY;
		} else {
			furthestY = minY;
		}
		// check if there is any intersection with the inner circle
		const fx = cx - furthestX;
		const fy = cy - furthestY;
		const halfWidth = this.width * 0.5;
		const innerRadius = this.radius - halfWidth;
		if ((fx * fx + fy * fy) < (innerRadius * innerRadius)) {
			// rectangle is completely inside the ring and cannot intersect
			return false;
		}
		// otherwise just do a circle - aabb test for outer circle
		// find closest point in rectangle to circle
		const nearestX = clamp(cx, minX, maxX);
		const nearestY = clamp(cy, minY, maxY);
		// test distance
		const dx = cx - nearestX;
		const dy = cy - nearestY;
		const outerRadius = this.radius + halfWidth;
		return (dx * dx + dy * dy) < (outerRadius * outerRadius);
	}
}

module.exports = RingCollidable;
