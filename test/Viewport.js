(function() {

    'use strict';

    const assert = require('assert');
    const Viewport = require('../src/Viewport');

    describe('Viewport', () => {

        before(() => {
        });

        after(() => {
        });

        describe('#constructor()', () => {
            it('should accept `width`, `height` and `pos` arguments', () => {
                const viewport = new Viewport({
                    width: 256,
                    height: 256
                });
                assert(viewport.width === 256);
                assert(viewport.height === 256);
                assert(viewport.pos[0] === 0);
                assert(viewport.pos[1] === 0);
            });
        });

        describe('#getPixelBounds()', () => {
            it('should return the inclusive pixel bounds of the Viewport', () => {
                const viewport = new Viewport({
                    width: 256,
                    height: 256
                });
                const bounds = viewport.getPixelBounds();
                assert(bounds.left === 0);
                assert(bounds.right === 255);
                assert(bounds.bottom === 0);
                assert(bounds.top === 255);
            });
        });

        describe('#getTileBounds()', () => {
            it('should return the inclusive tile bounds of the Viewport', () => {
                const viewport = new Viewport({
                    width: 256,
                    height: 256
                });
                const tileSize = 256;
                // (0, 0, 0)
                const bounds0 = viewport.getTileBounds(tileSize, 0);
                assert(bounds0.left === 0);
                assert(bounds0.right === 0);
                assert(bounds0.bottom === 0);
                assert(bounds0.top === 0);
                // // (1, 0, 0)
                const bounds1 = viewport.getTileBounds(tileSize, 1);
                assert(bounds1.left === 0);
                assert(bounds1.right === 0);
                assert(bounds1.bottom === 0);
                assert(bounds1.top === 0);
                // // (1, 1, 0)
                viewport.pos[0] = 256;
                viewport.pos[1] = 0;
                const bounds2 = viewport.getTileBounds(tileSize, 1);
                assert(bounds2.left === 1);
                assert(bounds2.right === 1);
                assert(bounds2.bottom === 0);
                assert(bounds2.top === 0);
                // // (1, 1, 1)
                viewport.pos[0] = 256;
                viewport.pos[1] = 256;
                const bounds3 = viewport.getTileBounds(tileSize, 1);
                assert(bounds3.left === 1);
                assert(bounds3.right === 1);
                assert(bounds3.bottom === 1);
                assert(bounds3.top === 1);
                // // (1, 0, 1)
                viewport.pos[0] = 0;
                viewport.pos[1] = 256;
                const bounds4 = viewport.getTileBounds(tileSize, 1);
                assert(bounds4.left === 0);
                assert(bounds4.right === 0);
                assert(bounds4.bottom === 1);
                assert(bounds4.top === 1);
            });
        });

    });

}());
