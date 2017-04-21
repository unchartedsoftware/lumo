'use strict';

const assert = require('assert');
const Viewport = require('../../src/plot/Viewport');

describe('Viewport', () => {

	describe('#constructor()', () => {
		it('should accept `width`, `height`, `x`, and `y` arguments', () => {
			const viewport = new Viewport(0.1, 0.2, 0.25, 0.15);
			assert(viewport.width === 0.25);
			assert(viewport.height === 0.15);
			assert(viewport.x === 0.1);
			assert(viewport.y === 0.2);
		});
	});

	describe('#getPixelSize()', () => {
		it('should return the width and height of the Viewport in pixels relative to the zoom and tileSize', () => {
			const viewport = new Viewport(0, 0, 1.0, 0.5);
			const tileSize = 256;
			const size0 = viewport.getPixelSize(0, tileSize);
			assert(size0.width === tileSize);
			assert(size0.height === tileSize/2);
			const size1 = viewport.getPixelSize(1, tileSize);
			assert(size1.width === tileSize*2);
			assert(size1.height === tileSize);
		});
	});

	describe('#getTileBounds()', () => {
		it('should return the inclusive tile bounds of the Viewport', () => {
			const viewport = new Viewport(0, 0, 1, 1);
			// (0, 0, 0)
			const bounds0 = viewport.getTileBounds(0);
			assert(bounds0.left === 0);
			assert(bounds0.right === 0);
			assert(bounds0.bottom === 0);
			assert(bounds0.top === 0);
			// // (1, 0, 0)
			viewport.width = 0.5;
			viewport.height = 0.5;
			const bounds1 = viewport.getTileBounds(1);
			assert(bounds1.left === 0);
			assert(bounds1.right === 0);
			assert(bounds1.bottom === 0);
			assert(bounds1.top === 0);
			// // (1, 1, 0)
			viewport.x = 0.5;
			viewport.y = 0;
			const bounds2 = viewport.getTileBounds(1);
			assert(bounds2.left === 1);
			assert(bounds2.right === 1);
			assert(bounds2.bottom === 0);
			assert(bounds2.top === 0);
			// // (1, 1, 1)
			viewport.x = 0.5;
			viewport.y = 0.5;
			const bounds3 = viewport.getTileBounds(1);
			assert(bounds3.left === 1);
			assert(bounds3.right === 1);
			assert(bounds3.bottom === 1);
			assert(bounds3.top === 1);
			// // (1, 0, 1)
			viewport.x = 0;
			viewport.y = 0.5;
			const bounds4 = viewport.getTileBounds(1);
			assert(bounds4.left === 0);
			assert(bounds4.right === 0);
			assert(bounds4.bottom === 1);
			assert(bounds4.top === 1);
		});
	});

});
