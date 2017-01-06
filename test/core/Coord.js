'use strict';

const assert = require('assert');
const Coord = require('../../src/core/Coord');

describe('Coord', () => {

	describe('#constructor()', () => {
		it('should accept four arguments, `z`, `x`, and `y`', () => {
			const coord = new Coord(4, 5, 6);
			assert(coord.z === 4);
			assert(coord.x === 5);
			assert(coord.y === 6);
		});
	});

	describe('#equals()', () => {
		it('should return true if the provided Coord is equal', () => {
			assert(new Coord(0, 0, 0).equals(new Coord(0, 0, 0)));
			assert(new Coord(1, 1, 1).equals(new Coord(1, 1, 1)));
			assert(new Coord(4, 5, 6).equals(new Coord(4, 5, 6)));
		});
		it('should return false if the provided Coord is not equal', () => {
			assert(!new Coord(0, 0, 0).equals(new Coord(1, 0, 0)));
			assert(!new Coord(1, 1, 1).equals(new Coord(1, 2, 1)));
			assert(!new Coord(4, 5, 6).equals(new Coord(4, 5, 7)));
		});
	});

	describe('#isAncestorOf()', () => {
		it('should return true if the Coord is the parent of the provided Coord', () => {
			const parent0 = new Coord(0, 0, 0);
			assert(parent0.isAncestorOf(new Coord(1, 0, 0)));
			assert(parent0.isAncestorOf(new Coord(1, 0, 1)));
			assert(parent0.isAncestorOf(new Coord(1, 1, 1)));
			assert(parent0.isAncestorOf(new Coord(1, 1, 0)));
			const parent1 = new Coord(1, 0, 1);
			assert(parent1.isAncestorOf(new Coord(2, 0, 2)));
			assert(parent1.isAncestorOf(new Coord(2, 1, 2)));
			assert(parent1.isAncestorOf(new Coord(2, 1, 3)));
			assert(parent1.isAncestorOf(new Coord(2, 0, 3)));
		});
		it('should return false if the Coord is not the parent of the provided Coord', () => {
			const parent = new Coord(1, 0, 1);
			assert(!parent.isAncestorOf(new Coord(0, 0, 0)));
			assert(!parent.isAncestorOf(new Coord(2, 0, 0)));
			assert(!parent.isAncestorOf(new Coord(2, 1, 0)));
			assert(!parent.isAncestorOf(new Coord(2, 1, 1)));
			assert(!parent.isAncestorOf(new Coord(2, 0, 1)));
			assert(!parent.isAncestorOf(new Coord(2, 2, 0)));
			assert(!parent.isAncestorOf(new Coord(2, 3, 0)));
			assert(!parent.isAncestorOf(new Coord(2, 3, 1)));
			assert(!parent.isAncestorOf(new Coord(2, 2, 0)));
			assert(!parent.isAncestorOf(new Coord(2, 2, 2)));
			assert(!parent.isAncestorOf(new Coord(2, 3, 2)));
			assert(!parent.isAncestorOf(new Coord(2, 3, 3)));
			assert(!parent.isAncestorOf(new Coord(2, 2, 3)));
		});
	});

	describe('#isDescendantOf()', () => {
		it('should return true if the Coord is a child of the provided Coord', () => {
			const parent0 = new Coord(0, 0, 0);
			assert(new Coord(1, 0, 0).isDescendantOf(parent0));
			assert(new Coord(1, 1, 0).isDescendantOf(parent0));
			assert(new Coord(1, 1, 1).isDescendantOf(parent0));
			assert(new Coord(1, 0, 1).isDescendantOf(parent0));
			const parent1 = new Coord(1, 0, 1);
			assert(new Coord(2, 0, 2).isDescendantOf(parent1));
			assert(new Coord(2, 1, 2).isDescendantOf(parent1));
			assert(new Coord(2, 1, 3).isDescendantOf(parent1));
			assert(new Coord(2, 0, 3).isDescendantOf(parent1));
		});
		it('should return false if the Coord is not a child of the provided Coord', () => {
			const parent = new Coord(1, 0, 1);
			assert(!new Coord(0, 0, 0).isDescendantOf(parent));
			assert(!new Coord(2, 0, 0).isDescendantOf(parent));
			assert(!new Coord(2, 1, 0).isDescendantOf(parent));
			assert(!new Coord(2, 1, 1).isDescendantOf(parent));
			assert(!new Coord(2, 0, 1).isDescendantOf(parent));
			assert(!new Coord(2, 2, 0).isDescendantOf(parent));
			assert(!new Coord(2, 3, 0).isDescendantOf(parent));
			assert(!new Coord(2, 3, 1).isDescendantOf(parent));
			assert(!new Coord(2, 2, 0).isDescendantOf(parent));
			assert(!new Coord(2, 2, 2).isDescendantOf(parent));
			assert(!new Coord(2, 3, 2).isDescendantOf(parent));
			assert(!new Coord(2, 3, 3).isDescendantOf(parent));
			assert(!new Coord(2, 2, 3).isDescendantOf(parent));
		});
	});

	describe('#getAncestor()', () => {
		it('should return the ancestor of the provided Coord', () => {
			// zoom 0
			assert(new Coord(1, 0, 0).getAncestor().equals(new Coord(0, 0, 0)));
			assert(new Coord(1, 1, 0).getAncestor().equals(new Coord(0, 0, 0)));
			assert(new Coord(1, 0, 1).getAncestor().equals(new Coord(0, 0, 0)));
			assert(new Coord(1, 1, 1).getAncestor().equals(new Coord(0, 0, 0)));
			// zoom 1
			assert(new Coord(2, 0, 1).getAncestor().equals(new Coord(1, 0, 0)));
			assert(new Coord(2, 2, 0).getAncestor().equals(new Coord(1, 1, 0)));
			assert(new Coord(2, 1, 3).getAncestor().equals(new Coord(1, 0, 1)));
			assert(new Coord(2, 3, 2).getAncestor().equals(new Coord(1, 1, 1)));
		});
		it('should accept a positive offset, which defaults to 1', () => {
			assert(new Coord(2, 0, 1).getAncestor(2).equals(new Coord(0, 0, 0)));
			assert(new Coord(2, 2, 0).getAncestor(2).equals(new Coord(0, 0, 0)));
			assert(new Coord(2, 1, 3).getAncestor(2).equals(new Coord(0, 0, 0)));
			assert(new Coord(2, 3, 2).getAncestor(2).equals(new Coord(0, 0, 0)));
		});
	});

	describe('#getDescendants()', () => {
		it('should return the descendants of the provided Coord', () => {
			// zoom 0
			const parent = new Coord(0, 0, 0);
			parent.getDescendants().forEach(coord => {
				coord.isDescendantOf(parent);
			});
		});
	});

});
