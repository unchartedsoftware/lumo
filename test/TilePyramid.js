(function() {

    'use strict';

    const assert = require('assert');
    const Coord = require('../src/Coord');
    const Layer = require('../src/Layer');
    const TilePyramid = require('../src/TilePyramid');

    let layer;

    describe('TilePyramid', () => {

        before(() => {
            layer = new Layer();
            layer.requestTile = (coord, done) => {
                done(null, {});
            };
        });

        after(() => {
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

        describe('#get()', () => {
            it('should get an active tile from the pyramid', () => {
                const pyramid = new TilePyramid(layer);
                const coord = new Coord(0, 0, 0);
                pyramid.requestTiles([coord]);
                assert(pyramid.get(coord) !== undefined);
            });
            it('should return `undefined` if the pyramid does not contain the tile', () => {
                const pyramid = new TilePyramid(layer);
                const coord = new Coord(0, 0, 0);
                assert(pyramid.get(coord) === undefined);
            });
        });

        describe('#getDescendants()', () => {
            it('should return any active descendants of the provided tile', () => {
                const pyramid = new TilePyramid(layer);
                pyramid.requestTiles([
                    // zoom 0
                    new Coord(0, 0, 0),
                    // zoom 1
                    new Coord(1, 0, 0),
                    new Coord(1, 1, 0),
                    new Coord(1, 1, 1),
                    new Coord(1, 0, 1)
                ]);
                const descendants0 = pyramid.getDescendants(new Coord(0, 0, 0));
                assert(descendants0.length === 4);
                pyramid.requestTiles([
                    // zoom 2
                    new Coord(2, 0, 0),
                    new Coord(2, 1, 0),
                    new Coord(2, 1, 1),
                    new Coord(2, 0, 1),
                    new Coord(2, 2, 2),
                    new Coord(2, 3, 2),
                    new Coord(2, 3, 3),
                    new Coord(2, 2, 3)
                ]);
                // zoom 2
                const descendants1 = pyramid.getDescendants(new Coord(0, 0, 0));
                const descendants2 = pyramid.getDescendants(new Coord(1, 0, 0));
                assert(descendants1.length === 12);
                assert(descendants2.length === 4);
            });
        });

        describe('#getAncestors()', () => {
            it('should return any active ancestors of the provided tile', () => {
                const pyramid = new TilePyramid(layer);
                pyramid.requestTiles([
                    // zoom 0
                    new Coord(0, 0, 0),
                    // zoom 1
                    new Coord(1, 0, 0),
                    new Coord(1, 1, 0),
                    new Coord(1, 1, 1),
                    new Coord(1, 0, 1)
                ]);
                assert(pyramid.getAncestors(new Coord(1, 0, 0)).length === 1);
                assert(pyramid.getAncestors(new Coord(1, 1, 0)).length === 1);
                assert(pyramid.getAncestors(new Coord(1, 1, 1)).length === 1);
                assert(pyramid.getAncestors(new Coord(1, 0, 1)).length === 1);
                pyramid.requestTiles([
                    // zoom 2
                    new Coord(2, 0, 0),
                    new Coord(2, 1, 0),
                    new Coord(2, 1, 1),
                    new Coord(2, 0, 1)
                ]);
                assert(pyramid.getAncestors(new Coord(2, 0, 0)).length === 2);
                assert(pyramid.getAncestors(new Coord(2, 1, 0)).length === 2);
                assert(pyramid.getAncestors(new Coord(2, 1, 1)).length === 2);
                assert(pyramid.getAncestors(new Coord(2, 0, 1)).length === 2);
            });
        });

        describe('#isOccludedByDescendants()', () => {
            it('should return true if descendants fully occlude the tile in the viewport', () => {

            });
            it('should return false if no descendants fully occlude the tile in the viewport', () => {

            });
        });
    });

}());
