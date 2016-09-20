(function() {

    'use strict';

    const assert = require('assert');
    const Coord = require('../src/Coord');
    const Viewport = require('../src/Viewport');

    describe('Coord', () => {

        before(() => {
        });

        after(() => {
        });

        describe('#constructor()', () => {
            it('should accept four arguments, `z`, `x`, and `y`', () => {
                const coord = new Coord(4, 5, 6);
                assert(coord.z === 4);
                assert(coord.x === 5);
                assert(coord.y === 6);
            });
        });

        describe('#equals()', () => {
            it('should return true if the provided Coord is equal', () => {
                assert(new Coord(0, 0, 0).equals(new Coord(0, 0, 0)));
                assert(new Coord(1, 1, 1).equals(new Coord(1, 1, 1)));
                assert(new Coord(4, 5, 6).equals(new Coord(4, 5, 6)));
            });
            it('should return false if the provided Coord is not equal', () => {
                assert(!new Coord(0, 0, 0).equals(new Coord(1, 0, 0)));
                assert(!new Coord(1, 1, 1).equals(new Coord(1, 2, 1)));
                assert(!new Coord(4, 5, 6).equals(new Coord(4, 5, 7)));
            });
        });

        describe('#isParentOf()', () => {
            it('should return true if the Coord is the parent of the provided Coord', () => {
                const parent0 = new Coord(0, 0, 0);
                assert(parent0.isParentOf(new Coord(1, 0, 0)));
                assert(parent0.isParentOf(new Coord(1, 0, 1)));
                assert(parent0.isParentOf(new Coord(1, 1, 1)));
                assert(parent0.isParentOf(new Coord(1, 1, 0)));
                const parent1 = new Coord(1, 0, 1);
                assert(parent1.isParentOf(new Coord(2, 0, 2)));
                assert(parent1.isParentOf(new Coord(2, 1, 2)));
                assert(parent1.isParentOf(new Coord(2, 1, 3)));
                assert(parent1.isParentOf(new Coord(2, 0, 3)));
            });
            it('should return false if the Coord is not the parent of the provided Coord', () => {
                const parent = new Coord(1, 0, 1);
                assert(!parent.isParentOf(new Coord(0, 0, 0)));
                assert(!parent.isParentOf(new Coord(2, 0, 0)));
                assert(!parent.isParentOf(new Coord(2, 1, 0)));
                assert(!parent.isParentOf(new Coord(2, 1, 1)));
                assert(!parent.isParentOf(new Coord(2, 0, 1)));
                assert(!parent.isParentOf(new Coord(2, 2, 0)));
                assert(!parent.isParentOf(new Coord(2, 3, 0)));
                assert(!parent.isParentOf(new Coord(2, 3, 1)));
                assert(!parent.isParentOf(new Coord(2, 2, 0)));
                assert(!parent.isParentOf(new Coord(2, 2, 2)));
                assert(!parent.isParentOf(new Coord(2, 3, 2)));
                assert(!parent.isParentOf(new Coord(2, 3, 3)));
                assert(!parent.isParentOf(new Coord(2, 2, 3)));
            });
        });

        describe('#isChildOf()', () => {
            it('should return true if the Coord is a child of the provided Coord', () => {
                const parent0 = new Coord(0, 0, 0);
                assert(new Coord(1, 0, 0).isChildOf(parent0));
                assert(new Coord(1, 1, 0).isChildOf(parent0));
                assert(new Coord(1, 1, 1).isChildOf(parent0));
                assert(new Coord(1, 0, 1).isChildOf(parent0));
                const parent1 = new Coord(1, 0, 1);
                assert(new Coord(2, 0, 2).isChildOf(parent1));
                assert(new Coord(2, 1, 2).isChildOf(parent1));
                assert(new Coord(2, 1, 3).isChildOf(parent1));
                assert(new Coord(2, 0, 3).isChildOf(parent1));
            });
            it('should return false if the Coord is not a child of the provided Coord', () => {
                const parent = new Coord(1, 0, 1);
                assert(!new Coord(0, 0, 0).isChildOf(parent));
                assert(!new Coord(2, 0, 0).isChildOf(parent));
                assert(!new Coord(2, 1, 0).isChildOf(parent));
                assert(!new Coord(2, 1, 1).isChildOf(parent));
                assert(!new Coord(2, 0, 1).isChildOf(parent));
                assert(!new Coord(2, 2, 0).isChildOf(parent));
                assert(!new Coord(2, 3, 0).isChildOf(parent));
                assert(!new Coord(2, 3, 1).isChildOf(parent));
                assert(!new Coord(2, 2, 0).isChildOf(parent));
                assert(!new Coord(2, 2, 2).isChildOf(parent));
                assert(!new Coord(2, 3, 2).isChildOf(parent));
                assert(!new Coord(2, 3, 3).isChildOf(parent));
                assert(!new Coord(2, 2, 3).isChildOf(parent));
            });
        });

        describe('#getPixelBounds()', () => {
            it('should return the inclusive pixel bounds of the Coord', () => {
                const tilesize = 256;
                const coord = new Coord(0, 0, 0);
                const bounds = coord.getPixelBounds(tilesize);
                assert(bounds.left === 0);
                assert(bounds.right === tilesize - 1);
                assert(bounds.bottom === 0);
                assert(bounds.top === tilesize - 1);
            });
            it('should accept a `tileSize` used to scale the bounds', () => {
                const tilesize = 100;
                const coord = new Coord(0, 0, 0);
                const bounds = coord.getPixelBounds(tilesize);
                assert(bounds.left === 0);
                assert(bounds.right === tilesize - 1);
                assert(bounds.bottom === 0);
                assert(bounds.top === tilesize - 1);
            });
            it('should accept an optional `zoom` parameter to scale the bounds by', () => {
                const tilesize = 256;
                const viewport = new Coord(0, 0, 0);
                const bounds = viewport.getPixelBounds(tilesize, 1);
                assert(bounds.left === 0);
                assert(bounds.right === (tilesize * 2) - 1);
                assert(bounds.bottom === 0);
                assert(bounds.top === (tilesize * 2) - 1);
            });
        });

        describe('#getDescendantTileBounds()', () => {
            it('should return the inclusive tile bounds of the descendants of the Coord', () => {
                // z = 1
                const bounds0 = new Coord(0, 0, 0).getDescendantTileBounds(1);
                assert(bounds0.left === 0);
                assert(bounds0.right === 1);
                assert(bounds0.bottom === 0);
                assert(bounds0.top === 1);
                // z = 2
                const bounds1 = new Coord(0, 0, 0).getDescendantTileBounds(2);
                assert(bounds1.left === 0);
                assert(bounds1.right === 3);
                assert(bounds1.bottom === 0);
                assert(bounds1.top === 3);
                // z = 3
                const bounds2 = new Coord(0, 0, 0).getDescendantTileBounds(3);
                assert(bounds2.left === 0);
                assert(bounds2.right === 7);
                assert(bounds2.bottom === 0);
                assert(bounds2.top === 7);
                // z = 2
                const bounds3 = new Coord(1, 1, 1).getDescendantTileBounds(2);
                assert(bounds3.left === 2);
                assert(bounds3.right === 3);
                assert(bounds3.bottom === 2);
                assert(bounds3.top === 3);
                // z = 3
                const bounds4 = new Coord(1, 1, 1).getDescendantTileBounds(3);
                assert(bounds4.left === 4);
                assert(bounds4.right === 7);
                assert(bounds4.bottom === 4);
                assert(bounds4.top === 7);
            });
            it('should throw an exception if the `descendantZoom` parameter is not an integer', () => {
                let err = false;
                try {
                    new Coord(1, 1, 1).getDescendantTileBounds(2.4);
                } catch(e) {
                    err = true;
                }
                assert(err);
            });
            it('should throw an exception if the `descendantZoom` is not a valid descendant zoom', () => {
                let err = false;
                try {
                    new Coord(1, 1, 1).getDescendantTileBounds(0);
                } catch(e) {
                    err = true;
                }
                assert(err);
            });
        });

        describe('#isInView()', () => {
            it('should return true if the coord is visible in the provided viewport', () => {
                const tileSize = 256;
                const viewport0 = new Viewport({
                    width: tileSize,
                    height: tileSize
                });
                assert(new Coord(0, 0, 0).isInView(tileSize, 0, viewport0));
                assert(new Coord(1, 0, 0).isInView(tileSize, 0, viewport0));
                assert(new Coord(2, 0, 0).isInView(tileSize, 0, viewport0));
            });
            it('should return false if the coord is not visible in the provided viewport', () => {
                const tileSize = 256;
                const viewport = new Viewport({
                    width: tileSize,
                    height: tileSize
                });
                viewport.x = tileSize;
                viewport.y = 0;
                assert(!new Coord(0, 0, 0).isInView(tileSize, 0, viewport));
                assert(!new Coord(1, 0, 0).isInView(tileSize, 0, viewport));
                assert(!new Coord(1, 1, 0).isInView(tileSize, 0, viewport));
                assert(!new Coord(1, 1, 1).isInView(tileSize, 0, viewport));
                assert(!new Coord(1, 0, 1).isInView(tileSize, 0, viewport));
            });
        });

    });

}());
