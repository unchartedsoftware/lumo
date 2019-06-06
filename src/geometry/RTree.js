'use strict';

const RBush = require('rbush');
const defaultTo = require('lodash/defaultTo');

/**
 * Class representing an r-tree.
 */
class RTree {

	/**
	 * Instantiates a new RTree object.
	 *
	 * @param {object} options - The options object.
	 * @param {boolean} options.nodeCapacity - The node capacity of the r-tree.
	 */
	constructor(options) {
		this.tree = new RBush(defaultTo(options.nodeCapacity, 32));
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
	 * @param {number} x - The x component.
	 * @param {number} y - The y component.
	 *
	 * @returns {object} The collision object.
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
		// inner shape test
		for (let i=0; i<collisions.length; i++) {
			const collision = collisions[i];
			if (collision.testPoint(x, y)) {
				return collision;
			}
		}
		return null;
	}

	/**
	 * Searchs the r-tree using a rectangle.
	 *
	 * @param {number} minX - The minimum x component.
	 * @param {number} maxX - The maximum x component.
	 * @param {number} minY - The minimum y component.
	 * @param {number} maxY - The maximum y component.
	 *
	 * @returns {object} The collision object.
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
		// inner shape test
		for (let i=0; i<collisions.length; i++) {
			const collision = collisions[i];
			if (collision.testRectangle(minX, maxX, minY, maxY)) {
				return collision;
			}
		}
		return null;
	}
}

module.exports = RTree;
