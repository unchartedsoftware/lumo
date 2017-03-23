'use strict';

const assert = require('assert');
const Bounds = require('../../src/core/Bounds');
const TILE_SIZE = 256;

describe('Bounds', () => {

	describe('#constructor()', () => {
		it('should accept four arguments, `left`, `right`, `bottom`, and `top`', () => {
			const bounds = new Bounds(0, TILE_SIZE, 0, TILE_SIZE);
			assert(bounds.left === 0);
			assert(bounds.right === TILE_SIZE);
			assert(bounds.bottom === 0);
			assert(bounds.top === TILE_SIZE);
		});
	});

	describe('#width()', () => {
		it('should return the width of the bounds', () => {
			const bounds = new Bounds(
				Math.floor(Math.random() * TILE_SIZE),
				Math.floor(TILE_SIZE + Math.random() * TILE_SIZE),
				Math.floor(Math.random() * TILE_SIZE),
				Math.floor(TILE_SIZE + Math.random() * TILE_SIZE));
			assert(bounds.width() === (bounds.right - bounds.left));
		});
	});

	describe('#height()', () => {
		it('should return the width of the bounds', () => {
			const bounds = new Bounds(
				Math.floor(Math.random() * TILE_SIZE),
				Math.floor(TILE_SIZE + Math.random() * TILE_SIZE),
				Math.floor(Math.random() * TILE_SIZE),
				Math.floor(TILE_SIZE + Math.random() * TILE_SIZE));
			assert(bounds.height() === (bounds.top - bounds.bottom));
		});
	});

	describe('#extend()', () => {
		it('should extend the bounds by the provided point', () => {
			const bounds = new Bounds(0, 1, 0, 1);
			bounds.extend({
				x: -2,
				y: -2
			});
			bounds.extend({
				x: 2,
				y: 2
			});
			assert(bounds.left === -2);
			assert(bounds.right === 2);
			assert(bounds.bottom === -2);
			assert(bounds.top === 2);
		});
		it('should extend the bounds by the provided point', () => {
			const bounds = new Bounds(0, 1, 0, 1);
			bounds.extend(new Bounds(-2, 2, -2, 2));
			assert(bounds.left === -2);
			assert(bounds.right === 2);
			assert(bounds.bottom === -2);
			assert(bounds.top === 2);
			bounds.extend(new Bounds(4, 8, 4, 8));
			assert(bounds.left === -2);
			assert(bounds.right === 8);
			assert(bounds.bottom === -2);
			assert(bounds.top === 8);
			bounds.extend(new Bounds(-8, -4, -8, -4));
			assert(bounds.left === -8);
			assert(bounds.right === 8);
			assert(bounds.bottom === -8);
			assert(bounds.top === 8);
		});
	});

	describe('#center()', () => {
		it('should return the center coordinate of the bounds', () => {
			const bounds = new Bounds(
				Math.floor(Math.random() * TILE_SIZE),
				Math.floor(TILE_SIZE + Math.random() * TILE_SIZE),
				Math.floor(Math.random() * TILE_SIZE),
				Math.floor(TILE_SIZE + Math.random() * TILE_SIZE));
			assert(bounds.center().x === bounds.left + (bounds.width() / 2));
			assert(bounds.center().y === bounds.bottom + (bounds.height() / 2));
		});
	});

	describe('#overlaps()', () => {
		it('should return true if the bounds overlap, inclusive of edges', () => {
			//  _ _ _ _ _ _ _ _ _ _ _
			// | d        |        c |
			// |      _ _ | _ _      |
			// |     |    |    |     |
			// |     |    |    |     |
			//  _ _ _ _ _ _ _ _ _ _ _
			// |     |    |    |     |
			// |     | e  |    |     |
			// |      _ _ | _ _      |
			// | a        |        b |
			//  _ _ _ _ _ _ _ _ _ _ _
			const a = new Bounds(0, 1, 0, 1);
			const b = new Bounds(1, 2, 0, 1);
			const c = new Bounds(1, 2, 1, 2);
			const d = new Bounds(0, 1, 1, 2);
			const e = new Bounds(0.5, 1.5, 0.5, 1.5);
			// area overlaps
			assert(a.overlaps(e));
			assert(e.overlaps(a));
			assert(b.overlaps(e));
			assert(e.overlaps(b));
			assert(c.overlaps(e));
			assert(e.overlaps(c));
			assert(d.overlaps(e));
			assert(e.overlaps(d));
			// edge overlaps
			// horizontal
			assert(a.overlaps(b));
			assert(b.overlaps(a));
			assert(d.overlaps(c));
			assert(c.overlaps(d));
			// vertical
			assert(a.overlaps(d));
			assert(d.overlaps(a));
			assert(b.overlaps(c));
			assert(c.overlaps(b));
			// diagonal
			assert(a.overlaps(c));
			assert(c.overlaps(a));
			assert(b.overlaps(d));
			assert(d.overlaps(b));
		});
		it('should return false if the bounds do not overlap, inclusive of edges', () => {
			//  _ _ _ _ _ _    _ _ _ _ _ _
			// | d         |  |         c |
			// |           |  |           |
			// |           |  |           |
			// |           |  |           |
			//  _ _ _ _ _ _    _ _ _ _ _ _
			//
			//  _ _ _ _ _ _    _ _ _ _ _ _
			// |           |  |           |
			// |           |  |           |
			// |           |  |           |
			// | a         |  |         b |
			//  _ _ _ _ _ _    _ _ _ _ _ _
			const a = new Bounds(0, 1, 0, 1);
			const b = new Bounds(2, 3, 0, 1);
			const c = new Bounds(2, 3, 2, 3);
			const d = new Bounds(0, 1, 2, 3);
			assert(!a.overlaps(b));
			assert(!a.overlaps(c));
			assert(!a.overlaps(d));
			assert(!b.overlaps(a));
			assert(!b.overlaps(c));
			assert(!b.overlaps(d));
			assert(!c.overlaps(a));
			assert(!c.overlaps(b));
			assert(!c.overlaps(d));
			assert(!d.overlaps(a));
			assert(!d.overlaps(b));
			assert(!d.overlaps(c));
		});
	});

	describe('#intersection()', () => {
		it('should return the intersection bounds, inclusive of edges', () => {
			//  _ _ _ _ _ _ _ _ _ _ _
			// | d        |        c |
			// |      _ _ | _ _      |
			// |     |    |    |     |
			// |     |    |    |     |
			//  _ _ _ _ _ _ _ _ _ _ _
			// |     |    |    |     |
			// |     | e  |    |     |
			// |      _ _ | _ _      |
			// | a        |        b |
			//  _ _ _ _ _ _ _ _ _ _ _
			const a = new Bounds(0, 1, 0, 1);
			const b = new Bounds(1, 2, 0, 1);
			const c = new Bounds(1, 2, 1, 2);
			const d = new Bounds(0, 1, 1, 2);
			const e = new Bounds(0.5, 1.5, 0.5, 1.5);
			// area overlaps
			assert(a.intersection(e).equals(new Bounds(0.5, 1.0, 0.5, 1.0)));
			assert(e.intersection(a).equals(new Bounds(0.5, 1.0, 0.5, 1.0)));
			assert(b.intersection(e).equals(new Bounds(1.0, 1.5, 0.5, 1.0)));
			assert(e.intersection(b).equals(new Bounds(1.0, 1.5, 0.5, 1.0)));
			assert(c.intersection(e).equals(new Bounds(1.0, 1.5, 1.0, 1.5)));
			assert(e.intersection(c).equals(new Bounds(1.0, 1.5, 1.0, 1.5)));
			assert(d.intersection(e).equals(new Bounds(0.5, 1.0, 1.0, 1.5)));
			assert(e.intersection(d).equals(new Bounds(0.5, 1.0, 1.0, 1.5)));
			// edge overlaps
			// horizontal
			assert(a.intersection(b).equals(new Bounds(1.0, 1.0, 0.0, 1.0)));
			assert(b.intersection(a).equals(new Bounds(1.0, 1.0, 0.0, 1.0)));
			assert(d.intersection(c).equals(new Bounds(1.0, 1.0, 1.0, 2.0)));
			assert(c.intersection(d).equals(new Bounds(1.0, 1.0, 1.0, 2.0)));
			// vertical
			assert(a.intersection(d).equals(new Bounds(0.0, 1.0, 1.0, 1.0)));
			assert(d.intersection(a).equals(new Bounds(0.0, 1.0, 1.0, 1.0)));
			assert(b.intersection(c).equals(new Bounds(1.0, 2.0, 1.0, 1.0)));
			assert(c.intersection(b).equals(new Bounds(1.0, 2.0, 1.0, 1.0)));
			// // diagonal
			assert(a.intersection(c).equals(new Bounds(1.0, 1.0, 1.0, 1.0)));
			assert(c.intersection(a).equals(new Bounds(1.0, 1.0, 1.0, 1.0)));
			assert(b.intersection(d).equals(new Bounds(1.0, 1.0, 1.0, 1.0)));
			assert(d.intersection(b).equals(new Bounds(1.0, 1.0, 1.0, 1.0)));
		});
		it('should return undefined if there is no intersection', () => {
			//  _ _ _ _ _ _    _ _ _ _ _ _
			// | d         |  |         c |
			// |           |  |           |
			// |           |  |           |
			// |           |  |           |
			//  _ _ _ _ _ _    _ _ _ _ _ _
			//
			//  _ _ _ _ _ _    _ _ _ _ _ _
			// |           |  |           |
			// |           |  |           |
			// |           |  |           |
			// | a         |  |         b |
			//  _ _ _ _ _ _    _ _ _ _ _ _
			const a = new Bounds(0, 1, 0, 1);
			const b = new Bounds(2, 3, 0, 1);
			const c = new Bounds(2, 3, 2, 3);
			const d = new Bounds(0, 1, 2, 3);
			assert(a.intersection(b) === undefined);
			assert(a.intersection(c) === undefined);
			assert(a.intersection(d) === undefined);
			assert(b.intersection(a) === undefined);
			assert(b.intersection(c) === undefined);
			assert(b.intersection(d) === undefined);
			assert(c.intersection(a) === undefined);
			assert(c.intersection(b) === undefined);
			assert(c.intersection(d) === undefined);
			assert(d.intersection(a) === undefined);
			assert(d.intersection(b) === undefined);
			assert(d.intersection(c) === undefined);
		});
	});

});
