'use strict';

const clamp = require('lodash/clamp');

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
	 * @param {number} xOffset - The tile x offset in pixels.
	 * @param {number} yOffset - The tile y offset in pixels.
	 * @param {Tile} tile - The tile object.
	 * @param {object} data - Any arbitrary user data.
	 */
	constructor(x, y, radius, xOffset, yOffset, tile, data) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.minX = x + xOffset - radius;
		this.maxX = x + xOffset + radius;
		this.minY = y + yOffset - radius;
		this.maxY = y + yOffset + radius;
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
		return (dx * dx + dy * dy) <= (this.radius * this.radius);
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
		// find closest point in rectangle to circle
		const nearestX = clamp(cx, minX, maxX);
		const nearestY = clamp(cy, minY, maxY);
		// test distance
		const dx = cx - nearestX;
		const dy = cy - nearestY;
		return (dx * dx + dy * dy) < (this.radius * this.radius);
	}
}

module.exports = CircleCollidable;
