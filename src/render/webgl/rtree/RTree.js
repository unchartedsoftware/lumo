'use strict';

const rbush = require('rbush');
const defaultTo = require('lodash/defaultTo');
const CollisionType = require('./CollisionType');

/**
 * Class representing an r-tree.
 */
class RTree {

	/**
	 * Instantiates a new RTree object.
	 *
	 * @param {Object} options - The options object.
	 * @param {boolean} options.collisionType - The collision type of the collidables.
	 * @param {boolean} options.nodeCapacity - The node capacity of the r-tree.
	 */
	constructor(options) {
		this.collisionType = defaultTo(options.collisionType, CollisionType.CIRCLE);
		this.tree = rbush(defaultTo(options.nodeCapacity, 32));
	}

	/**
	 * Inserts an array of collidables into the r-tree.
	 *
	 * @param {Array} collidables - The array of collidables to insert.
	 */
	insert(collidables) {
		this.tree.load(collidables);
	}

	/**
	 * Removes an array of collidables from the r-tree.
	 *
	 * @param {Array} collidables - The array of collidables to remove.
	 */
	remove(collidables) {
		const tree = this.tree;
		for (let i=0; i<collidables.length; i++) {
			tree.remove(collidables[i]);
		}
	}

	/**
	 * Searchs the r-tree using a point.
	 *
	 * @param {Number} x - The x component.
	 * @param {Number} y - The y component.
	 *
	 * @returns {Object} The collision object.
	 */
	searchPoint(x, y) {
		const collisions = this.tree.search({
			minX: x,
			maxX: x,
			minY: y,
			maxY: y
		});
		if (collisions.length === 0) {
			return null;
		}
		if (this.collisionType === CollisionType.RECTANGLE) {
			// rectangle, return result as is
			return collisions[0];
		}
		// do a circle - point check
		for (let i=0; i<collisions.length; i++) {
			const collision = collisions[i];
			// distance to center of square
			const cx = (collision.minX + collision.maxX) * 0.5;
			const cy = (collision.minY + collision.maxY) * 0.5;
			const dx = cx - x;
			const dy = cy - y;
			// assume the boxes are squares
			const radius = cx;
			if ((dx * dx + dy * dy) <= (radius * radius)) {
				return collision;
			}
		}
		return null;
	}

	/**
	 * Searchs the r-tree using a rectangle.
	 *
	 * @param {Number} minX - The minimum x component.
	 * @param {Number} maxX - The maximum x component.
	 * @param {Number} minY - The minimum x component.
	 * @param {Number} maxY - The maximum x component.
	 * @param {Number} y - The y component.
	 *
	 * @returns {Object} The collision object.
	 */
	searchRectangle(minX, maxX, minY, maxY) {
		const collisions = this.tree.search({
			minX: minX,
			maxX: maxX,
			minY: minY,
			maxY: maxY
		});
		if (collisions.length === 0) {
			return null;
		}
		if (this.collisionType === CollisionType.RECTANGLE) {
			// rectangle, return result as is
			return collisions[0];
		}

		// get rect half width / height
		const halfWidth = (minX + maxX) * 0.5;
		const halfHeight = (minY + maxY) * 0.5;

		// do a circle - rectangle check
		for (let i=0; i<collisions.length; i++) {
			const collision = collisions[i];
			// circle position
			const circleX = (collision.minX + collision.maxX) * 0.5;
			const circleY = (collision.minY + collision.maxY) * 0.5;
			// distance from rectangle bottom-left
			const dx = Math.abs(circleX - minX);
			const dy = Math.abs(circleY - minY);
			// assume the boxes are squares
			const radius = collision.minX + collision.maxX;
			if ((dx > (halfWidth + radius)) ||
				(dy > (halfHeight + radius))) {
				return false;
			}
			if ((dx <= (halfWidth)) || (dy <= (halfHeight))) {
				return collision;
			}
			const cornerDist =
				Math.pow(2, dx - halfWidth) +
				Math.pow(2, dy - halfHeight);
			if (cornerDist <= (radius * radius)) {
				return collision;
			}
		}
		return null;
	}
}

module.exports = RTree;
