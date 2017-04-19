'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Coord = require('../../src/core/Coord');
const EventType = require('../../src/event/EventType');
const Layer = require('../../src/layer/Layer');
const TilePyramid = require('../../src/layer/TilePyramid');
const Viewport = require('../../src/plot/Viewport');

describe('TilePyramid', () => {

	let layer;
	let plot;
	let pyramid;

	beforeEach(() => {
		// layer
		layer = new Layer();
		layer.requestTile = (coord, done) => {
			done(null, {});
		};
		// plot
		plot = {
			zoom: 0,
			tileSize: 256,
			viewport: new Viewport({
				x: -0.5,
				y: -0.5,
				width: 2.0,
				height: 2.0
			}),
			getTargetViewportCenter: function() {
				return this.viewport.getCenter();
			},
			getTargetZoom: function() {
				return this.zoom;
			},
			getTargetViewport: function() {
				return this.viewport;
			}
		};
		layer.plot = plot;
		// pyramid
		pyramid = layer.pyramid;
	});

	afterEach(() => {
		layer = null;
	});

	describe('#constructor()', () => {
		it('should accept a `layer` argument', () => {
			new TilePyramid(layer);
		});
		it('should throw an error if there is no `layer` argument', () => {
			let err = false;
			try {
				new TilePyramid();
			} catch(e) {
				err = true;
			}
			assert(err);
		});
	});

	describe('#getCapacity()', () => {
		it('should return the maximum capacity of the pyramid', () => {
			const capacity = pyramid.getCapacity();
			const sumPowOfFour = (1/3) * (Math.pow(4, pyramid.numPersistentLevels) - 1);
			assert(capacity === pyramid.cacheSize + sumPowOfFour);
		});
	});

	describe('#has()', () => {
		it('should return `true` if the pyramid contains a tile for the provided coord', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.numPersistentLevels + 1, 0, 0);
			pyramid.requestTiles([ coordA, coordB ]);
			assert(pyramid.has(coordA));
			assert(pyramid.has(coordB));
		});
		it('should return `false` if the pyramid does not contain the tile', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.numPersistentLevels + 1, 0, 0);
			assert(!pyramid.has(coordA));
			assert(!pyramid.has(coordB));
		});
	});

	describe('#get()', () => {
		it('should get an active tile from the pyramid', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.numPersistentLevels + 1, 0, 0);
			pyramid.requestTiles([ coordA, coordB ]);
			assert(pyramid.get(coordA) !== undefined);
			assert(pyramid.get(coordB) !== undefined);
		});
		it('should return `undefined` if the pyramid does not contain the tile', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.numPersistentLevels + 1, 0, 0);
			assert(pyramid.get(coordA) === undefined);
			assert(pyramid.get(coordB) === undefined);
		});
	});

	describe('#clear()', () => {
		it('should clear all tile references held in the tile pyramid', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.numPersistentLevels + 1, 0, 0);
			const coordC = new Coord(pyramid.numPersistentLevels + 1, 1, 0);
			pyramid.requestTiles([ coordA, coordB, coordC ]);
			pyramid.clear();
			assert(!pyramid.has(coordA));
			assert(!pyramid.has(coordB));
			assert(!pyramid.has(coordC));
		});
		it('should flag all currently pending tiles as stale', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.numPersistentLevels + 1, 0, 0);
			let resolve;
			const promise = new Promise(res => {
				resolve = res;
			});
			layer.requestTile = (coord, callback) => {
				promise.then(() => {
					pyramid.stale.has(coord.hash);
					callback(null, {});
					assert(!pyramid.has(coord));
				});
			};
			pyramid.requestTiles([ coordA, coordB ]);
			pyramid.clear();
			resolve();
		});
	});

	describe('#getAncestor()', () => {
		it('should return the ancestor tile of the coord at the provided distance', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(1, 0, 0);
			const coordC = new Coord(2, 0, 0);
			const coordD = new Coord(3, 0, 0);
			const coordE = new Coord(4, 0, 0);
			pyramid.requestTiles([ coordA, coordB, coordC, coordD, coordE ]);
			assert(pyramid.getAncestor(coordE, 1).coord.equals(coordD));
			assert(pyramid.getAncestor(coordE, 2).coord.equals(coordC));
			assert(pyramid.getAncestor(coordE, 3).coord.equals(coordB));
			assert(pyramid.getAncestor(coordE, 4).coord.equals(coordA));
			assert(pyramid.getAncestor(coordD, 1).coord.equals(coordC));
			assert(pyramid.getAncestor(coordD, 2).coord.equals(coordB));
			assert(pyramid.getAncestor(coordD, 3).coord.equals(coordA));
			assert(pyramid.getAncestor(coordC, 1).coord.equals(coordB));
			assert(pyramid.getAncestor(coordC, 2).coord.equals(coordA));
			assert(pyramid.getAncestor(coordB, 1).coord.equals(coordA));
		});
		it('should return `undefined` if no ancestor exists in the pyramid for the provided distance', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(1, 0, 0);
			const coordC = new Coord(2, 3, 3);
			pyramid.requestTiles([ coordA, coordB, coordC ]);
			assert(pyramid.getAncestor(coordA, 1) === undefined);
			assert(pyramid.getAncestor(coordB, 2) === undefined);
			assert(pyramid.getAncestor(coordC, 1) === undefined);
		});
	});

	describe('#getDescendants()', () => {
		it('should return the descendant tiles of the coord at the provided distance', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(1, 0, 0);
			const coordC = new Coord(1, 1, 0);
			const coordD = new Coord(1, 1, 1);
			const coordE = new Coord(1, 0, 1);
			pyramid.requestTiles([ coordB, coordC, coordD, coordE ]);
			const descendants = pyramid.getDescendants(coordA, 1);
			assert(descendants.length === 4);
			descendants.forEach(descendant => {
				assert(
					descendant.coord.equals(coordB) ||
					descendant.coord.equals(coordC) ||
					descendant.coord.equals(coordD) ||
					descendant.coord.equals(coordE));
			});
		});
		it('should return the missing coordinates if there is at least one descendant in the pyramid', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(1, 0, 0);
			const coordC = new Coord(1, 1, 0);
			const coordD = new Coord(1, 1, 1);
			const coordE = new Coord(1, 0, 1);
			pyramid.requestTiles([ coordB, coordC, coordD ]);
			const descendants = pyramid.getDescendants(coordA, 1);
			assert(descendants.length === 4);
			descendants.forEach(descendant => {
				if (descendant.coord) {
					// found tiles
					assert(
						descendant.coord.equals(coordB) ||
						descendant.coord.equals(coordC) ||
						descendant.coord.equals(coordD));
				} else {
					// missing tile
					assert(descendant.equals(coordE));
				}
			});
		});
		it('should return `undefined` if no descendants exists in the pyramid for the provided distance', () => {
			const coordA = new Coord(0, 0, 0);
			const descendants = pyramid.getDescendants(coordA, 1);
			assert(descendants === undefined);
		});
	});

	describe('#getAvailableLOD()', () => {
		it('should return the exact tile if available', () => {
			const coord = new Coord(2, 2, 2);
			pyramid.requestTiles([ coord ]);
			const tiles = pyramid.getAvailableLOD(coord);
			assert(tiles[0].coord.equals(coord));
		});
		it('should return the closest available tile level-of-detail', () => {
			const coord = new Coord(2, 2, 2);
			pyramid.requestTiles([
				new Coord(0, 0, 0),
				new Coord(3, 4, 4),
				new Coord(3, 5, 5),
				new Coord(3, 5, 4)
			]);
			const tiles = pyramid.getAvailableLOD(coord);
			tiles.forEach(tile => {
				assert(
					tile.coord.equals(new Coord(3, 4, 4)) ||
					tile.coord.equals(new Coord(3, 5, 5)) ||
					tile.coord.equals(new Coord(3, 5, 4)) ||
					tile.coord.equals(new Coord(0, 0, 0)));
			});
		});
		it('should return `undefined` if there is no available tile', () => {
			const coord = new Coord(0, 0, 0);
			assert(pyramid.getAvailableLOD(coord) === undefined);
		});
	});

	describe('#requestTiles()', () => {
		it('should request tiles for the provided tile coordinates', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(1, 0, 0);
			const tiles = {
				[coordA.hash]: 'A',
				[coordB.hash]: 'B'
			};
			layer.requestTile = (coord, done) => {
				done(null, tiles[coord.hash]);
			};
			pyramid.requestTiles([ coordA, coordB ]);
			assert(pyramid.get(coordA).data === tiles[coordA.hash]);
			assert(pyramid.get(coordB).data === tiles[coordB.hash]);
		});
		it('should not request duplicate coordinates', () => {
			const requestTile = sinon.stub(layer, 'requestTile');
			pyramid.requestTiles([
				new Coord(0, 0, 0),
				new Coord(0, 0, 0),
				new Coord(0, 0, 0)
			]);
			assert(requestTile.callCount === 1);
		});
		it('should normalize coordinates before making requests', () => {
			const coords = [
				new Coord(0, 0, 0),
				new Coord(0, 1, 0),
				new Coord(0, -1, 0),
				new Coord(0, 0, 1),
				new Coord(0, 0, -1),
				new Coord(0, 1, 1),
				new Coord(0, -1, -1)
			];
			const requestTile = sinon.stub(layer, 'requestTile');
			pyramid.requestTiles(coords);
			assert(requestTile.callCount === 1);
		});
		it('should emit a `TILE_ADD` event from the layer if the tile request succeeds', done => {
			layer.on(EventType.TILE_ADD, () => {
				done();
			});
			pyramid.requestTiles([
				new Coord(0, 0, 0)
			]);
		});
		it('should emit a `TILE_FAILURE` event from the layer if the tile request fails', done => {
			layer.requestTile = (coord, callback) => {
				callback(new Error('error'), null);
			};
			layer.on(EventType.TILE_FAILURE, () => {
				done();
			});
			pyramid.requestTiles([
				new Coord(0, 0, 0)
			]);
		});
		it('should emit a `TILE_DISCARD` event from the layer if the tile is no longer in view', done => {
			layer.requestTile = (coord, callback) => {
				// move tile out of view
				layer.plot.viewport.centerOn({
					x: 10000,
					y: 10000
				});
				callback(null, {});
			};
			layer.on(EventType.TILE_DISCARD, () => {
				done();
			});
			pyramid.requestTiles([
				new Coord(0, 0, 0)
			]);
		});
		it('should emit a `TILE_DISCARD` event from the layer if pyramid has been cleared before the response is received', done => {
			let resolve;
			const promise = new Promise(r => {
				resolve = r;
			});
			layer.requestTile = (_, callback) => {
				promise.then(() => {
					callback(null, {});
				});
			};
			layer.on(EventType.TILE_DISCARD, () => {
				done();
			});
			pyramid.requestTiles([
				new Coord(0, 0, 0)
			]);
			pyramid.clear();
			resolve();
		});
		it('should emit a `LOAD` event from the layer if all pending tile requests have succeeded', done => {
			const coords = [
				new Coord(0, 0, 0),
				new Coord(1, 0, 0),
				new Coord(2, 0, 0),
				new Coord(3, 0, 0)
			];
			layer.on(EventType.LOAD, function() {
				assert(count === coords.length);
				done();
			});
			let count = 0;
			layer.requestTile = (coord, callback) => {
				count++;
				callback(null, {});
			};
			pyramid.requestTiles(coords);
		});
		it('should emit a `LOAD` event from the layer if all pending tile requests have failed', done => {
			const coords = [
				new Coord(0, 0, 0),
				new Coord(1, 0, 0),
				new Coord(2, 0, 0),
				new Coord(3, 0, 0)
			];
			let count = 0;
			layer.requestTile = (coord, callback) => {
				count++;
				callback(new Error('error'), null);
			};
			layer.on(EventType.LOAD, function() {
				assert(count === coords.length);
				done();
			});
			pyramid.requestTiles(coords);
		});
		it('should not emit a `LOAD` event from the layer if all pending tile requests are stale', done => {
			const coords = [
				new Coord(0, 0, 0),
				new Coord(1, 0, 0),
				new Coord(2, 0, 0),
				new Coord(3, 0, 0)
			];
			const promises = [];
			const resolves = {};
			coords.forEach(coord => {
				const promise = new Promise(res => {
					resolves[coord.hash] = res;
				});
				promises.push(promise);
			});
			let resolve;
			const promise = new Promise(res => {
				resolve = res;
			});
			layer.requestTile = (coord, callback) => {
				promise.then(() => {
					if (coord.z % 2 === 0) {
						// succeed
						callback(null, {});
					} else {
						// fail
						callback(new Error('error'), null);
					}
					resolves[coord.hash]();
				});
			};
			layer.on(EventType.LOAD, function() {
				assert(false);
			});
			pyramid.requestTiles(coords);
			pyramid.clear();
			resolve();
			Promise.all(promises).then(() => {
				done();
			});
		});
		it('should emit a `LOAD` event from the layer if all pending tile requests are discarded', done => {
			const coords = [
				new Coord(0, 0, 0),
				new Coord(1, 0, 0),
				new Coord(2, 0, 0),
				new Coord(3, 0, 0)
			];
			let count = 0;
			layer.requestTile = (coord, callback) => {
				// move tile out of view
				layer.plot.viewport.centerOn({
					x: 10000,
					y: 10000
				});
				count++;
				callback(null, {});
			};
			layer.on(EventType.LOAD, () => {
				assert(count === coords.length);
				done();
			});
			pyramid.requestTiles(coords);
		});
		it('should discard multiple stale requests for the same coord', done => {
			const coord = new Coord(0, 0, 0);

			let r0, r1, r2;
			const p0 = new Promise(resolve => { r0 = resolve; });
			const p1 = new Promise(resolve => { r1 = resolve; });
			const p2 = new Promise(resolve => { r2 = resolve; });

			// first request
			layer.requestTile = (_, callback) => {
				p0.then(() => {
					callback(null, {});
				});
			};
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			assert(!pyramid.isPending(coord));

			// second request
			layer.requestTile = (_, callback) => {
				p1.then(() => {
					callback(null, {});
				});
			};
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			assert(!pyramid.isPending(coord));

			// third request
			layer.requestTile = (_, callback) => {
				p2.then(() => {
					callback(null, {});
				});
			};
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			assert(!pyramid.isPending(coord));

			// resolve all requests
			r0();
			r1();
			r2();
			Promise.all([p0, p1, 2]).then(() => {
				// no more stale tiles
				assert(!pyramid.isPending(coord));
				// pyramid has discarded all tiles as stale
				assert(!pyramid.has(coord));
				done();
			});
		});
		it('should handle calling `clear` inside the `requestTile` method', done => {
			const coord = new Coord(0, 0, 0);

			// 1) request tileA
			// 2) clear pyramid flagging tileA as stale
			// 3) resolve tileA, should be discarded
			layer.requestTile = (_, callback) => {
				// clear the pyramid
				pyramid.clear();
				// request should no longer be pending
				assert(!pyramid.isPending(coord));
				// finish callback
				callback(null, {});
				// should have discarded the response
				assert(!pyramid.has(coord));
			};
			pyramid.requestTiles([ coord ]);

			// 1) request tileA
			// 2) clear pyramid flagging tileA as stale
			// 3) request tileB
			// 4) resolve tileA, should be discarded, tileB should be pending
			// 5) resolve tileB, should be added
			layer.requestTile = (_0, callback0) => {
				const tile0 = {};
				const tile1 = {};

				// clear the pyramid
				pyramid.clear();

				// should have discarded the response
				assert(!pyramid.isPending(coord));

				let resolve;
				const promise = new Promise(r => {
					resolve = r;
				});

				// swap request func and request again, async
				layer.requestTile = (_1, callback1) => {
					promise.then(() => {
						callback1(null, tile1);
						// should have the correct response
						assert(pyramid.get(coord).data === tile1);
						done();
					});
				};
				pyramid.requestTiles([ coord ]);

				// resolve the first stale tile
				callback0(null, tile0);

				// should still be pending the first
				assert(pyramid.isPending(coord));

				// resolve tileB
				resolve();
			};
			pyramid.requestTiles([ coord ]);
		});
		it('should handle calling `clear` inside the `requestTile` method', () => {
			const coord = new Coord(0, 0, 0);
			// first request
			layer.requestTile = (_, callback) => {
				// clear the pyramid
				pyramid.clear();
				// finish callback
				callback(null, {});
				// should have discarded the response
				assert(!pyramid.isPending(coord));
				assert(!pyramid.has(coord));
			};
			pyramid.requestTiles([ coord ]);
		});
		it('should discard multiple out of sync stale request responses for the same coord', done => {
			const coord = new Coord(0, 0, 0);
			const hash = coord.normalize().hash;
			let r0, r1, r2;
			const p0 = new Promise(resolve => { r0 = resolve; });
			const p1 = new Promise(resolve => { r1 = resolve; });
			const p2 = new Promise(resolve => { r2 = resolve; });
			layer.requestTile = (_, callback) => {
				p0.then(() => {
					callback(null, {});
					// discarded the last stale tile
					assert(!pyramid.isPending(coord));
					done();
				});
			};
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			assert(!pyramid.isPending(coord));

			layer.requestTile = (_, callback) => {
				p1.then(() => {
					callback(null, {});
					// discarded the tile, one stale tile left
					assert(pyramid.stale.get(hash).size === 1);
				});
			};
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			assert(!pyramid.isPending(coord));

			layer.requestTile = (_, callback) => {
				p2.then(() => {
					const data = {};
					// resolve the non-stale tile
					callback(null, data);
					// did not discard the latest request
					assert(pyramid.has(coord));
					assert(pyramid.get(coord).data === data);
					// two stale tiles
					assert(!pyramid.isPending(coord));
				});
			};
			pyramid.requestTiles([ coord ]);
			r2();
			r1();
			r0();
		});
	});

});
