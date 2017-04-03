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
				width: 1.0,
				height: 1.0
			}),
			getTargetCenter: function() {
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

	describe('#has()', () => {
		it('should return `true` if the pyramid contains a tile for the provided coord', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.persistentLevels + 1, 0, 0);
			pyramid.requestTiles([ coordA, coordB ]);
			assert(pyramid.has(coordA));
			assert(pyramid.has(coordB));
		});
		it('should return `false` if the pyramid does not contain the tile', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.persistentLevels + 1, 0, 0);
			assert(!pyramid.has(coordA));
			assert(!pyramid.has(coordB));
		});
	});

	describe('#get()', () => {
		it('should get an active tile from the pyramid', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.persistentLevels + 1, 0, 0);
			pyramid.requestTiles([ coordA, coordB ]);
			assert(pyramid.get(coordA) !== undefined);
			assert(pyramid.get(coordB) !== undefined);
		});
		it('should return `undefined` if the pyramid does not contain the tile', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.persistentLevels + 1, 0, 0);
			assert(pyramid.get(coordA) === undefined);
			assert(pyramid.get(coordB) === undefined);
		});
	});

	describe('#clear()', () => {
		it('should clear all tile references held in the tile pyramid', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.persistentLevels + 1, 0, 0);
			const coordC = new Coord(pyramid.persistentLevels + 1, 1, 0);
			pyramid.requestTiles([ coordA, coordB, coordC ]);
			pyramid.clear();
			assert(!pyramid.has(coordA));
			assert(!pyramid.has(coordB));
			assert(!pyramid.has(coordC));
		});
		it('should flag all currently pending tiles as stale', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.persistentLevels + 1, 0, 0);
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

	describe('#getClosestAncestor()', () => {
		it('should return the closest ancestor of the coord held in the pyramid', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.persistentLevels + 1, 0, 0);
			const coordC = new Coord(1, 0, 0);
			const coordD = new Coord(pyramid.persistentLevels + 2, 0, 0);
			pyramid.requestTiles([ coordA, coordB ]);
			assert(pyramid.getClosestAncestor(coordC).equals(coordA));
			assert(pyramid.getClosestAncestor(coordD).equals(coordB));
		});
		it('should return `undefined` if there is no ancestor for the the coord in the pyramid', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.persistentLevels + 1, 0, 0);
			const coordC = new Coord(2, 3, 3);
			const coordD = new Coord(1, 0, 0);
			pyramid.requestTiles([ coordC ]);
			assert(pyramid.getClosestAncestor(coordA) === undefined);
			assert(pyramid.getClosestAncestor(coordB) === undefined);
			assert(pyramid.getClosestAncestor(coordD) === undefined);
		});
	});

	describe('#getAvailableLOD()', () => {
		it('should return the closest available tile coordinate', () => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.persistentLevels + 1, 0, 0);
			const coordC = new Coord(1, 0, 0);
			const coordD = new Coord(pyramid.persistentLevels + 2, 0, 0);
			pyramid.requestTiles([ coordA, coordB ]);
			assert(pyramid.getAvailableLOD(coordA).tile.coord.equals(coordA));
			assert(pyramid.getAvailableLOD(coordC).tile.coord.equals(coordA));
			assert(pyramid.getAvailableLOD(coordD).tile.coord.equals(coordB));
		});
		it('should return `undefined` if there is no available tile', () => {
			const coordA = new Coord(0, 0, 0);
			assert(pyramid.getAvailableLOD(coordA) === undefined);
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
		it('should emit a `TILE_DISCARD` event from the layer if the layer is no longer attached to the plot', done => {
			let resolve;
			const promise = new Promise(res => {
				resolve = res;
			});
			layer.requestTile = (coord, callback) => {
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
			plot.layer = null;
			layer.plot = null;
			resolve();
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
					callback(null, {});
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
			const hash = coord.normalize().hash;

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
			assert(pyramid.stale.get(hash).size === 1);

			// second request
			layer.requestTile = (_, callback) => {
				p1.then(() => {
					callback(null, {});
				});
			};
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			assert(pyramid.stale.get(hash).size === 2);

			// third request
			layer.requestTile = (_, callback) => {
				p2.then(() => {
					callback(null, {});
				});
			};
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			assert(pyramid.stale.get(hash).size === 3);

			// resolve all requests
			r0();
			r1();
			r2();
			Promise.all([p0, p1, 2]).then(() => {
				// no more stale tiles
				assert(!pyramid.stale.has(hash));
				// pyramid has discarded all tiles as stale
				assert(!pyramid.has(coord));
				done();
			});
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
					assert(!pyramid.stale.has(hash));
					done();
				});
			};
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			assert(pyramid.stale.get(hash).size === 1);
			layer.requestTile = (_, callback) => {
				p1.then(() => {
					callback(null, {});
					// discarded the tile, one stale tile left
					assert(pyramid.stale.get(hash).size === 1);
				});
			};
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			assert(pyramid.stale.get(hash).size === 2);
			layer.requestTile = (_, callback) => {
				p2.then(() => {
					callback(null, {});
					// two stale tiles
					assert(pyramid.stale.get(hash).size === 2);
					// did not discard the latest request
					assert(pyramid.has(coord));
				});
			};
			pyramid.requestTiles([ coord ]);
			r2();
			r1();
			r0();
		});
		it('should cleared stale tile flags for the erroneous tiles responses', done => {
			const coord = new Coord(0, 0, 0);
			const hash = coord.normalize().hash;
			let resolve;
			const promise = new Promise(res => {
				resolve = res;
			});
			layer.requestTile = (_, callback) => {
				promise.then(() => {
					callback(new Error('error'), null);
					// discarded the last stale tile
					assert(!pyramid.stale.has(hash));
					done();
				});
			};
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			resolve();
		});
	});

});
