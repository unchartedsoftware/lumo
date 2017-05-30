'use strict';

/**
 * Class representing a rectangle collidable.
 */
class RectangleCollidable {

	/**
	 * Instantiates a new RectangleCollidable object.
	 *
	 * @param {number} minX - The left bound in pixels.
	 * @param {number} maxX - The right bound in pixels.
	 * @param {number} minY - The bottom bound in pixels.
	 * @param {number} maxY - The top bound in pixels.
	 * @param {number} xOffset - The tile x offset in pixels.
	 * @param {number} yOffset - The tile y offset in pixels.
	 * @param {Tile} tile - The tile object.
	 * @param {Object} data - Any arbitrary user data.
	 */
	constructor(minX, maxX, minY, maxY, xOffset, yOffset, tile, data) {
		this.minX = minX + xOffset;
		this.maxX = maxX + xOffset;
		this.minY = minY + yOffset;
		this.maxY = maxY + yOffset;
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
	/* eslint-disable no-unused-vars */
	testPoint(x, y) {
		return true;
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
	/* eslint-disable no-unused-vars */
	testRectangle(minX, maxX, minY, maxY) {
		return true;
	}
}

module.exports = RectangleCollidable;
