'use strict';

const assert = require('assert');
const Cell = require('../../src/plot/Cell');

describe('Cell', () => {

	describe('#constructor()', () => {
		it('should accept `zoom`, `center`, `extent` arguments', () => {
			const zoom = Math.random() * 24;
			const tileSize = 256;
			const extent = Math.pow(2, zoom) * tileSize;
			const center = {
				x: Math.random(),
				y: Math.random()
			};
			const cell = new Cell(zoom, center, extent);
			assert(cell.zoom === zoom);
			assert(cell.extent === extent);
			assert(cell.center.x === center.x);
			assert(cell.center.y === center.y);
		});
	});

});
