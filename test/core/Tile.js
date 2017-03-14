'use strict';

const assert = require('assert');
const Coord = require('../../src/core/Coord');
const Tile = require('../../src/core/Tile');

describe('Tile', () => {

	describe('#constructor()', () => {
		it('should accept a `coord` argument', () => {
			const coord = new Coord(4, 5, 6);
			const tile = new Tile(coord);
			assert(tile.coord === coord);
		});
		it('should generate a uid sufficient enough to be unique', () => {
			const tiles = [];
			const n = 100;
			for (let i=0; i<n; i++) {
				tiles.push(new Tile(new Coord(0, 0, 0)));
			}
			for (let i=0; i<n; i++) {
				for (let j=i+1; j<n; j++) {
					assert(tiles[i].uid !== tiles[j].uid);
				}
			}
		});
	});

});
