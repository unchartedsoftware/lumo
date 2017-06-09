'use strict';

const assert = require('assert');
const Bounds = require('../../src/geometry/Bounds');
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

	describe('#getWidth()', () => {
		it('should return the width of the bounds', () => {
			const bounds = new Bounds(
				Math.floor(Math.random() * TILE_SIZE),
				Math.floor(TILE_SIZE + Math.random() * TILE_SIZE),
				Math.floor(Math.random() * TILE_SIZE),
				Math.floor(TILE_SIZE + Math.random() * TILE_SIZE));
			assert(bounds.getWidth() === (bounds.right - bounds.left));
		});
	});

	describe('#getHeight()', () => {
		it('should return the width of the bounds', () => {
			const bounds = new Bounds(
				Math.floor(Math.random() * TILE_SIZE),
				Math.floor(TILE_SIZE + Math.random() * TILE_SIZE),
				Math.floor(Math.random() * TILE_SIZE),
				Math.floor(TILE_SIZE + Math.random() * TILE_SIZE));
			assert(bounds.getHeight() === (bounds.top - bounds.bottom));
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

	describe('#getCenter()', () => {
		it('should return the center coordinate of the bounds', () => {
			const bounds = new Bounds(
				Math.floor(Math.random() * TILE_SIZE),
				Math.floor(TILE_SIZE + Math.random() * TILE_SIZE),
				Math.floor(Math.random() * TILE_SIZE),
				Math.floor(TILE_SIZE + Math.random() * TILE_SIZE));
			assert(bounds.getCenter().x === bounds.left + (bounds.getWidth() / 2));
			assert(bounds.getCenter().y === bounds.bottom + (bounds.getHeight() / 2));
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

	describe('#clipPoints()', () => {
		it('should clip any provided points outside of the bounds', () => {
			const bounds = new Bounds(-1, 1, -1, 1);
			const points = [];
			for (let i=0; i<32; i++) {
				points.push({
					x: Math.random() * 4 - 2,
					y: Math.random() * 4 - 2
				});
			}
			for (let i=0; i<32; i++) {
				points.push({
					x: Math.random() * 2 - 1,
					y: Math.random() * 2 - 1
				});
			}
			const clipped = bounds.clipPoints(points);
			clipped.forEach(point => {
				assert(point.x >= bounds.left);
				assert(point.x <= bounds.right);
				assert(point.y >= bounds.bottom);
				assert(point.y <= bounds.top);
			});
		});
		it('should return null if no points are within the bounds', () => {
			const bounds = new Bounds(0, 1, 0, 1);
			const points = [];
			for (let i=0; i<64; i++) {
				points.push({
					x: 1.1 + Math.random(),
					y: 1.1 + Math.random()
				});
			}
			const clipped = bounds.clipPoints(points);
			assert(clipped === null);
		});
		it('should return null if the input is empty or invalid', () => {
			const bounds = new Bounds(0, 1, 0, 1);
			assert(bounds.clipPoints([]) === null);
			assert(bounds.clipPoints() === null);
			assert(bounds.clipPoints(null) === null);
			assert(bounds.clipPoints(undefined) === null);
		});
	});

	describe('#clipLine()', () => {
		it('should clip a provided line inside of the bounds', () => {
			const bounds = new Bounds(-1, 1, -1, 1);
			const lines = [];
			for (let i=0; i<64; i++) {
				lines.push([
					{
						x: Math.random() * 4 - 2,
						y: Math.random() * 4 - 2
					},
					{
						x: Math.random() * 4 - 2,
						y: Math.random() * 4 - 2
					}
				]);
			}
			lines.push([
				{ x: 1.1, y: 0 },
				{ x: 0, y: -1.1 }
			]);
			lines.push([
				{ x: 0, y: -1.1 },
				{ x: -1.1, y: 0 }
			]);
			lines.push([
				{ x: -1.1, y: 0 },
				{ x: 0, y: 1.1 }
			]);
			lines.push([
				{ x: 0, y: 1.1 },
				{ x: 1.1, y: 0 }
			]);
			const clipped = [];
			lines.forEach(line => {
				const clippedLine = bounds.clipLine(line);
				if (clippedLine) {
					clipped.push(clippedLine);
				}
			});
			clipped.forEach(line => {
				assert(line[0].x >= bounds.left);
				assert(line[0].x <= bounds.right);
				assert(line[0].y >= bounds.bottom);
				assert(line[0].y <= bounds.top);
				assert(line[1].x >= bounds.left);
				assert(line[1].x <= bounds.right);
				assert(line[1].y >= bounds.bottom);
				assert(line[1].y <= bounds.top);
			});
		});
		it('should return null if the line is not within the bounds', () => {
			const bounds = new Bounds(0, 1, 0, 1);
			const lines = [];
			for (let i=0; i<64; i++) {
				lines.push([
					{
						x: 1.1 + Math.random(),
						y: 1.1 + Math.random(),
					},
					{
						x: 1.1 + Math.random(),
						y: 1.1 + Math.random(),
					}
				]);
			}
			lines.forEach(line => {
				const clipped = bounds.clipLine(line);
				assert(clipped === null);
			});
		});
		it('should return null if the input is empty or invalid', () => {
			const bounds = new Bounds(0, 1, 0, 1);
			assert(bounds.clipLine([]) === null);
			assert(bounds.clipLine([{ x: 0, y: 0 }]) === null);
			assert(bounds.clipLine(null) === null);
			assert(bounds.clipLine(undefined) === null);
		});
	});

	describe('#clipPolyline()', () => {
		it('should clip a provided polyline inside of the bounds', () => {
			const bounds = new Bounds(-1, 1, -1, 1);
			const polyline = [];
			for (let i=0; i<4; i++) {
				polyline.push({
					x: Math.random() * 4 - 2,
					y: Math.random() * 4 - 2,
				});
			}
			polyline.push({ x: 1.1, y: 0 });
			polyline.push({ x: 0, y: -1.1 });
			polyline.push({ x: -1.1, y: 0 });
			polyline.push({ x: 0, y: 1.1 });
			polyline.push({ x: 1.1, y: 0 });
			polyline.push({ x: 0, y: 0 });
			polyline.push({ x: 0, y: 0.5 });
			const clipped = bounds.clipPolyline(polyline);
			clipped.forEach(segment => {
				segment.forEach(point => {
					assert(point.x >= bounds.left);
					assert(point.x <= bounds.right);
					assert(point.y >= bounds.bottom);
					assert(point.y <= bounds.top);
				});
			});
		});
		it('should return null if the polyline is not within the bounds', () => {
			const bounds = new Bounds(0, 1, 0, 1);
			const polyline = [];
			for (let i=0; i<64; i++) {
				polyline.push({
					x: 1.1 + Math.random(),
					y: 1.1 + Math.random(),
				});
			}
			const clipped = bounds.clipPolyline(polyline);
			assert(clipped === null);
		});
		it('should return null if the input is empty or invalid', () => {
			const bounds = new Bounds(0, 1, 0, 1);
			assert(bounds.clipPolyline([]) === null);
			assert(bounds.clipPolyline([{ x: 0, y: 0 }]) === null);
			assert(bounds.clipPolyline(null) === null);
			assert(bounds.clipPolyline(undefined) === null);
		});
	});

	describe('#clipPolygon()', () => {
		it('should clip a provided polyline inside of the bounds', () => {
			const bounds = new Bounds(-1, 1, -1, 1);
			const polygon = [
				{ x: -1.67, y: -0.33 },
				{ x: -1.00, y: -0.33 },
				{ x: -0.33, y: -0.33 },
				{ x: -0.33, y: -0.67 },
				{ x: -0.33, y: -1.33 },
				{ x: -0.33, y: -1.67 },
				{ x: 0.33, y: -1.67 },
				{ x: 0.33, y: -0.33 },
				{ x: 1.67, y: -0.33 },
				{ x: 1.67, y: 0.33 },
				{ x: 0.33, y: 0.33 },
				{ x: 0.33, y: 1.67 },
				{ x: -0.33, y: 1.67 },
				{ x: -0.33, y: 0.33 },
				{ x: -0.67, y: 0.33 },
				{ x: -1.67, y: 0.33 }
			];
			const clipped = bounds.clipPolygon(polygon);
			clipped.forEach(point => {
				assert(point.x >= bounds.left);
				assert(point.x <= bounds.right);
				assert(point.y >= bounds.bottom);
				assert(point.y <= bounds.top);
			});
		});
		it('should return null if the polyline is not within the bounds', () => {
			const bounds = new Bounds(0, 1, 0, 1);
			const polygon = [
				{ x: 1.33, y: 2.67 },
				{ x: 2.00, y: 2.67 },
				{ x: 2.67, y: 2.67 },
				{ x: 2.67, y: 2.33 },
				{ x: 2.67, y: 1.67 },
				{ x: 2.67, y: 1.33 },
				{ x: 3.33, y: 1.33 },
				{ x: 3.33, y: 2.67 },
				{ x: 4.67, y: 2.67 },
				{ x: 4.67, y: 3.33 },
				{ x: 3.33, y: 3.33 },
				{ x: 3.33, y: 4.67 },
				{ x: 2.67, y: 4.67 },
				{ x: 2.67, y: 3.33 },
				{ x: 2.33, y: 3.33 },
				{ x: 1.33, y: 3.33 }
			];
			const clipped = bounds.clipPolygon(polygon);
			assert(clipped === null);
		});
		it('should return null if the input is empty or invalid', () => {
			const bounds = new Bounds(0, 1, 0, 1);
			assert(bounds.clipPolygon([]) === null);
			assert(bounds.clipPolygon([{ x: 0, y: 0 }]) === null);
			assert(bounds.clipPolygon(null) === null);
			assert(bounds.clipPolygon(undefined) === null);
		});
	});

});
