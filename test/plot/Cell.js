'use strict';

const assert = require('assert');
const Cell = require('../../src/plot/Cell');

describe('Cell', () => {

	describe('#constructor()', () => {
		it('should accept `zoom`, `centerPx`, `tileSize` arguments', () => {
			const zoom = Math.random() * 24;
			const tileSize = 256;
			const centerPx = {
				x: Math.random() * Math.pow(2, zoom) * tileSize,
				y: Math.random() * Math.pow(2, zoom) * tileSize
			};
			const cell = new Cell(zoom, centerPx, tileSize);
			assert(cell.zoom === zoom);
			assert(cell.centerPx.x === centerPx.x);
			assert(cell.centerPx.y === centerPx.y);
		});
	});

});
