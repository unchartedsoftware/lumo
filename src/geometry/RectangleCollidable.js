'use strict';

/**
 * Class representing a rectangle collidable.
 */
class RectangleCollidable {

	/**
	 * Instantiates a new RectangleCollidable object.
	 *
	 * @param {number} x - The center x pixel coordinate.
	 * @param {number} y - The center y pixel coordinate.
	 * @param {number} width - The width in pixels.
	 * @param {number} height - The height in pixels.
	 * @param {number} xOffset - The tile x offset in pixels.
	 * @param {number} yOffset - The tile y offset in pixels.
	 * @param {Tile} tile - The tile object.
	 * @param {Object} data - Any arbitrary user data. Optional.
	 */
	constructor(x, y, width, height, xOffset, yOffset, tile, data = null) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.minX = x + xOffset - (width * 0.5);
		this.maxX = x + xOffset + (width * 0.5);
		this.minY = y + yOffset - (height * 0.5);
		this.maxY = y + yOffset + (height * 0.5);
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
