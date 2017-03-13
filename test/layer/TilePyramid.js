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
				x: -256,
				y: -256,
				width: 512,
				height: 512
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
			layer.requestTile = (coord, callback) => {
				pyramid.clear();
				assert(pyramid.isStale(coord));
				callback(null, {});
			};
			pyramid.requestTiles([ coordA, coordB ]);
		});
		it('should handle multiple stale requests for the same tile', done => {
			const coord = new Coord(0, 0, 0);
			const hash = coord.normalize().hash;
			let count = 0;
			layer.requestTile = (_, callback) => {
				setTimeout(() => {
					count++;
					callback(null, {});
					if (count === 3) {
						assert(!pyramid.isStale(coord));
						done();
					}
				}, 100);
			};
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			assert(pyramid.stale.get(hash) === 1);
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			assert(pyramid.stale.get(hash) === 2);
			pyramid.requestTiles([ coord ]);
			pyramid.clear();
			assert(pyramid.stale.get(hash) === 3);
		});
	});

	describe('#isStale()', () => {
		it('should return true if the tile coordinate is no longer within the viewport', () => {
			layer.plot.viewport.centerOn({
				x: 10000,
				y: 10000
			});
			assert(pyramid.isStale(new Coord(0, 0, 0)));
		});
		it('should return true if the pyramid\'s layer is not longer attached to a plot', () => {
			layer.plot = null;
			assert(pyramid.isStale(new Coord(0, 0, 0)));
		});
		it('should return true if the pyramid has been cleared since issuing the request', () => {
			layer.pyramid = pyramid;
			const coord = new Coord(0, 0, 0);
			layer.requestTile = (c, callback) => {
				pyramid.clear();
				assert(pyramid.isStale(coord));
				callback(null, {});
			};
			layer.requestTiles([coord]);
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
		it('should return the closest available tile', done => {
			const coordA = new Coord(0, 0, 0);
			const coordB = new Coord(pyramid.persistentLevels + 1, 0, 0);
			const coordC = new Coord(1, 0, 0);
			const coordD = new Coord(pyramid.persistentLevels + 2, 0, 0);
			const promises = [];
			layer.requestTile = (coord, callback) => {
				const promise = new Promise(resolve => {
					setTimeout(() => {
						callback(null, coord.hash);
						resolve();
					}, 100);
				});
				promises.push(promise);
			};
			pyramid.requestTiles([ coordA, coordB ]);
			Promise.all(promises).then(() => {
				const lodA = pyramid.getAvailableLOD(coordC);
				const lodB = pyramid.getAvailableLOD(coordD);
				assert(lodA.tile.data === coordA.hash);
				assert(lodB.tile.data === coordB.hash);
				done();
			});
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
		it('should emit a `TILE_DISCARD` event from the layer if the tile request succeeds but the tile is no longer in view', done => {
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
	});
});
