'use strict';

const assert = require('assert');
const TileCoord = require('../../../src/layer/tile/TileCoord');

describe('TileCoord', () => {

	describe('#constructor()', () => {
		it('should accept four arguments, `z`, `x`, and `y`', () => {
			const coord = new TileCoord(4, 5, 6);
			assert(coord.z === 4);
			assert(coord.x === 5);
			assert(coord.y === 6);
		});
	});

	describe('#xyz()', () => {
		it('should return the portion of a URL for the XYZ tile specification', () => {
			assert(new TileCoord(0, 0, 0).xyz() === '0/0/0');
			assert(new TileCoord(1, 1, 1).xyz() === '1/1/0');
			assert(new TileCoord(4, 5, 6).xyz() === '4/5/9');
		});
	});

	describe('#tms()', () => {
		it('should return the portion of a URL for the XYZ tile specification', () => {
			assert(new TileCoord(0, 0, 0).tms() === '0/0/0');
			assert(new TileCoord(1, 1, 1).tms() === '1/1/1');
			assert(new TileCoord(4, 5, 6).tms() === '4/5/6');
		});
	});

	describe('#equals()', () => {
		it('should return true if the provided TileCoord is equal', () => {
			assert(new TileCoord(0, 0, 0).equals(new TileCoord(0, 0, 0)));
			assert(new TileCoord(1, 1, 1).equals(new TileCoord(1, 1, 1)));
			assert(new TileCoord(4, 5, 6).equals(new TileCoord(4, 5, 6)));
		});
		it('should return false if the provided TileCoord is not equal', () => {
			assert(!new TileCoord(0, 0, 0).equals(new TileCoord(1, 0, 0)));
			assert(!new TileCoord(1, 1, 1).equals(new TileCoord(1, 2, 1)));
			assert(!new TileCoord(4, 5, 6).equals(new TileCoord(4, 5, 7)));
		});
	});

	describe('#isAncestorOf()', () => {
		it('should return true if the TileCoord is the parent of the provided TileCoord', () => {
			const parent0 = new TileCoord(0, 0, 0);
			assert(parent0.isAncestorOf(new TileCoord(1, 0, 0)));
			assert(parent0.isAncestorOf(new TileCoord(1, 0, 1)));
			assert(parent0.isAncestorOf(new TileCoord(1, 1, 1)));
			assert(parent0.isAncestorOf(new TileCoord(1, 1, 0)));
			const parent1 = new TileCoord(1, 0, 1);
			assert(parent1.isAncestorOf(new TileCoord(2, 0, 2)));
			assert(parent1.isAncestorOf(new TileCoord(2, 1, 2)));
			assert(parent1.isAncestorOf(new TileCoord(2, 1, 3)));
			assert(parent1.isAncestorOf(new TileCoord(2, 0, 3)));
		});
		it('should return false if the TileCoord is not the parent of the provided TileCoord', () => {
			const parent = new TileCoord(1, 0, 1);
			assert(!parent.isAncestorOf(new TileCoord(0, 0, 0)));
			assert(!parent.isAncestorOf(new TileCoord(2, 0, 0)));
			assert(!parent.isAncestorOf(new TileCoord(2, 1, 0)));
			assert(!parent.isAncestorOf(new TileCoord(2, 1, 1)));
			assert(!parent.isAncestorOf(new TileCoord(2, 0, 1)));
			assert(!parent.isAncestorOf(new TileCoord(2, 2, 0)));
			assert(!parent.isAncestorOf(new TileCoord(2, 3, 0)));
			assert(!parent.isAncestorOf(new TileCoord(2, 3, 1)));
			assert(!parent.isAncestorOf(new TileCoord(2, 2, 0)));
			assert(!parent.isAncestorOf(new TileCoord(2, 2, 2)));
			assert(!parent.isAncestorOf(new TileCoord(2, 3, 2)));
			assert(!parent.isAncestorOf(new TileCoord(2, 3, 3)));
			assert(!parent.isAncestorOf(new TileCoord(2, 2, 3)));
		});
	});

	describe('#isDescendantOf()', () => {
		it('should return true if the TileCoord is a child of the provided TileCoord', () => {
			const parent0 = new TileCoord(0, 0, 0);
			assert(new TileCoord(1, 0, 0).isDescendantOf(parent0));
			assert(new TileCoord(1, 1, 0).isDescendantOf(parent0));
			assert(new TileCoord(1, 1, 1).isDescendantOf(parent0));
			assert(new TileCoord(1, 0, 1).isDescendantOf(parent0));
			const parent1 = new TileCoord(1, 0, 1);
			assert(new TileCoord(2, 0, 2).isDescendantOf(parent1));
			assert(new TileCoord(2, 1, 2).isDescendantOf(parent1));
			assert(new TileCoord(2, 1, 3).isDescendantOf(parent1));
			assert(new TileCoord(2, 0, 3).isDescendantOf(parent1));
		});
		it('should return false if the TileCoord is not a child of the provided TileCoord', () => {
			const parent = new TileCoord(1, 0, 1);
			assert(!new TileCoord(0, 0, 0).isDescendantOf(parent));
			assert(!new TileCoord(2, 0, 0).isDescendantOf(parent));
			assert(!new TileCoord(2, 1, 0).isDescendantOf(parent));
			assert(!new TileCoord(2, 1, 1).isDescendantOf(parent));
			assert(!new TileCoord(2, 0, 1).isDescendantOf(parent));
			assert(!new TileCoord(2, 2, 0).isDescendantOf(parent));
			assert(!new TileCoord(2, 3, 0).isDescendantOf(parent));
			assert(!new TileCoord(2, 3, 1).isDescendantOf(parent));
			assert(!new TileCoord(2, 2, 0).isDescendantOf(parent));
			assert(!new TileCoord(2, 2, 2).isDescendantOf(parent));
			assert(!new TileCoord(2, 3, 2).isDescendantOf(parent));
			assert(!new TileCoord(2, 3, 3).isDescendantOf(parent));
			assert(!new TileCoord(2, 2, 3).isDescendantOf(parent));
		});
	});

	describe('#getAncestor()', () => {
		it('should return the ancestor of the provided TileCoord', () => {
			// zoom 0
			assert(new TileCoord(1, 0, 0).getAncestor().equals(new TileCoord(0, 0, 0)));
			assert(new TileCoord(1, 1, 0).getAncestor().equals(new TileCoord(0, 0, 0)));
			assert(new TileCoord(1, 0, 1).getAncestor().equals(new TileCoord(0, 0, 0)));
			assert(new TileCoord(1, 1, 1).getAncestor().equals(new TileCoord(0, 0, 0)));
			// zoom 1
			assert(new TileCoord(2, 0, 1).getAncestor().equals(new TileCoord(1, 0, 0)));
			assert(new TileCoord(2, 2, 0).getAncestor().equals(new TileCoord(1, 1, 0)));
			assert(new TileCoord(2, 1, 3).getAncestor().equals(new TileCoord(1, 0, 1)));
			assert(new TileCoord(2, 3, 2).getAncestor().equals(new TileCoord(1, 1, 1)));
		});
		it('should accept a positive offset, which defaults to 1', () => {
			assert(new TileCoord(2, 0, 1).getAncestor(2).equals(new TileCoord(0, 0, 0)));
			assert(new TileCoord(2, 2, 0).getAncestor(2).equals(new TileCoord(0, 0, 0)));
			assert(new TileCoord(2, 1, 3).getAncestor(2).equals(new TileCoord(0, 0, 0)));
			assert(new TileCoord(2, 3, 2).getAncestor(2).equals(new TileCoord(0, 0, 0)));
		});
	});

	describe('#getDescendants()', () => {
		it('should return the descendants of the provided TileCoord', () => {
			// zoom 0
			const parent = new TileCoord(0, 0, 0);
			parent.getDescendants().forEach(coord => {
				coord.isDescendantOf(parent);
			});
		});
	});

	describe('#getCenter()', () => {
		it('should return the plot coordinate for the center of tile', () => {
			const a = new TileCoord(0, 0, 0);
			const b = new TileCoord(1, 0, 0);
			const c = new TileCoord(1, 1, 0);
			const d = new TileCoord(1, 1, 1);
			const e = new TileCoord(1, 0, 1);
			// a
			assert(a.getCenter().x === 0.5);
			assert(a.getCenter().y === 0.5);
			// b
			assert(b.getCenter().x === 0.25);
			assert(b.getCenter().y === 0.25);
			// c
			assert(c.getCenter().x === 0.75);
			assert(c.getCenter().y === 0.25);
			// d
			assert(d.getCenter().x === 0.75);
			assert(d.getCenter().y === 0.75);
			// e
			assert(e.getCenter().x === 0.25);
			assert(e.getCenter().y === 0.75);
		});
	});

	describe('#getPosition()', () => {
		it('should return the plot coordinate for the bottom-left of the tile', () => {
			const a = new TileCoord(0, 0, 0);
			const b = new TileCoord(1, 0, 0);
			const c = new TileCoord(1, 1, 0);
			const d = new TileCoord(1, 1, 1);
			const e = new TileCoord(1, 0, 1);
			// a
			assert(a.getPosition().x === 0.0);
			assert(a.getPosition().y === 0.0);
			// b
			assert(b.getPosition().x === 0.0);
			assert(b.getPosition().y === 0.0);
			// c
			assert(c.getPosition().x === 0.5);
			assert(c.getPosition().y === 0.0);
			// d
			assert(d.getPosition().x === 0.5);
			assert(d.getPosition().y === 0.5);
			// e
			assert(e.getPosition().x === 0.0);
			assert(e.getPosition().y === 0.5);
		});
	});

});
