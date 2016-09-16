(function() {

    'use strict';

    const assert = require('assert');
    const Coord = require('../src/Coord');
    const Enum = require('../src/Enum');
    const Layer = require('../src/Layer');
    const Tile = require('../src/Tile');
    const TilePyramid = require('../src/TilePyramid');

    describe('TilePyramid', () => {

        before(() => {
        });

        after(() => {
        });

        describe('#constructor()', () => {
            it('should accept a `layer` argument', () => {
                new TilePyramid(new Layer());
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

        describe('#add()', () => {
            it('should add an active tile to the pyramid', () => {
                const pyramid = new TilePyramid(new Layer());
                const coord = new Coord(0, 0, 0);
                const tile = new Tile(coord);
                pyramid.add(tile);
                assert(pyramid.has(coord));
            });
            it('should throw an exception if the `tile` is already part of the pyramid', () => {
                let err = false;
                try {
                    const pyramid = new TilePyramid(new Layer());
                    const coord = new Coord(0, 0, 0);
                    const tile = new Tile(coord);
                    pyramid.add(tile);
                    pyramid.add(tile);
                } catch(e) {
                    err = true;
                }
                assert(err);
            });
        });

        describe('#remove()', () => {
            it('should remove an active tile from the pyramid', () => {
                const pyramid = new TilePyramid(new Layer());
                const coord0 = new Coord(0, 0, 0);
                const coord1 = new Coord(1, 0, 0);
                const tile0 = new Tile(coord0);
                const tile1 = new Tile(coord1);
                pyramid.add(tile0);
                pyramid.add(tile1);
                pyramid.remove(tile0);
                pyramid.remove(tile1);
                assert(!pyramid.has(coord0));
                assert(!pyramid.has(coord1));
            });
            it('should throw an exception if the `tile` is not part of the pyramid', () => {
                let err = false;
                try {
                    const pyramid = new TilePyramid(new Layer());
                    const coord = new Coord(0, 0, 0);
                    const tile = new Tile(coord);
                    pyramid.remove(tile);
                } catch(e) {
                    err = true;
                }
                assert(err);
            });
        });

        describe('#get()', () => {
            it('should get an active tile from the pyramid', () => {
                const pyramid = new TilePyramid(new Layer());
                const coord = new Coord(0, 0, 0);
                const tile = new Tile(coord);
                pyramid.add(tile);
                assert(pyramid.get(coord) === tile);
            });
            it('should return `undefined` if the pyramid does not contain the tile', () => {
                const pyramid = new TilePyramid(new Layer());
                const coord = new Coord(0, 0, 0);
                assert(pyramid.get(coord) === undefined);
            });
        });

        describe('#forEach()', () => {
            it('should execute the provided function for each tile in the pyramid', () => {
                const pyramid = new TilePyramid(new Layer());
                pyramid.add(new Tile(new Coord(0, 0, 0)));
                pyramid.add(new Tile(new Coord(1, 0, 0)));
                pyramid.add(new Tile(new Coord(1, 1, 0)));
                pyramid.add(new Tile(new Coord(1, 1, 1)));
                pyramid.add(new Tile(new Coord(1, 0, 1)));
                const tiles = [];
                pyramid.forEach(tile => {
                    tiles.push(tile);
                });
                assert(tiles.length === 5);
            });
            it('should return `undefined` if the pyramid does not contain the tile', () => {
                const pyramid = new TilePyramid(new Layer());
                const coord = new Coord(0, 0, 0);
                assert(pyramid.get(coord) === undefined);
            });
        });

        describe('#tiles()', () => {
            it('should return the tiles in an array, sorted by level, in descending order by default', () => {
                const pyramid = new TilePyramid(new Layer());
                pyramid.add(new Tile(new Coord(0, 0, 0)));
                pyramid.add(new Tile(new Coord(1, 0, 0)));
                pyramid.add(new Tile(new Coord(2, 0, 0)));
                pyramid.add(new Tile(new Coord(3, 0, 0)));
                pyramid.add(new Tile(new Coord(4, 0, 0)));
                pyramid.add(new Tile(new Coord(5, 0, 0)));
                const tiles = pyramid.tiles();
                assert(tiles[0].coord.z === 0);
                assert(tiles[1].coord.z === 1);
                assert(tiles[2].coord.z === 2);
                assert(tiles[3].coord.z === 3);
                assert(tiles[4].coord.z === 4);
                assert(tiles[5].coord.z === 5);
            });
            it('should accept an ordering enum', () => {
                const pyramid = new TilePyramid(new Layer());
                pyramid.add(new Tile(new Coord(0, 0, 0)));
                pyramid.add(new Tile(new Coord(1, 0, 0)));
                pyramid.add(new Tile(new Coord(2, 0, 0)));
                pyramid.add(new Tile(new Coord(3, 0, 0)));
                pyramid.add(new Tile(new Coord(4, 0, 0)));
                pyramid.add(new Tile(new Coord(5, 0, 0)));
                const asc = pyramid.tiles(Enum.SORT_ASC);
                assert(asc[0].coord.z === 0);
                assert(asc[1].coord.z === 1);
                assert(asc[2].coord.z === 2);
                assert(asc[3].coord.z === 3);
                assert(asc[4].coord.z === 4);
                assert(asc[5].coord.z === 5);
                const desc = pyramid.tiles(Enum.SORT_DESC);
                assert(desc[0].coord.z === 5);
                assert(desc[1].coord.z === 4);
                assert(desc[2].coord.z === 3);
                assert(desc[3].coord.z === 2);
                assert(desc[4].coord.z === 1);
                assert(desc[5].coord.z === 0);
            });
        });

        describe('#getDescendants()', () => {
            it('should return any active descendants of the provided tile', () => {
                const pyramid = new TilePyramid(new Layer());
                // zoom 0
                pyramid.add(new Tile(new Coord(0, 0, 0)));
                // zoom 1
                pyramid.add(new Tile(new Coord(1, 0, 0)));
                pyramid.add(new Tile(new Coord(1, 1, 0)));
                pyramid.add(new Tile(new Coord(1, 1, 1)));
                pyramid.add(new Tile(new Coord(1, 0, 1)));
                const descendants0 = pyramid.getDescendants(new Coord(0, 0, 0));
                assert(descendants0.length === 4);
                // zoom 2
                pyramid.add(new Tile(new Coord(2, 0, 0)));
                pyramid.add(new Tile(new Coord(2, 1, 0)));
                pyramid.add(new Tile(new Coord(2, 1, 1)));
                pyramid.add(new Tile(new Coord(2, 0, 1)));
                pyramid.add(new Tile(new Coord(2, 2, 2)));
                pyramid.add(new Tile(new Coord(2, 3, 2)));
                pyramid.add(new Tile(new Coord(2, 3, 3)));
                pyramid.add(new Tile(new Coord(2, 2, 3)));
                const descendants1 = pyramid.getDescendants(new Coord(0, 0, 0));
                const descendants2 = pyramid.getDescendants(new Coord(1, 0, 0));
                assert(descendants1.length === 12);
                assert(descendants2.length === 4);
            });
        });

        describe('#getAncestors()', () => {
            it('should return any active ancestors of the provided tile', () => {
                const pyramid = new TilePyramid(new Layer());
                // zoom 0
                pyramid.add(new Tile(new Coord(0, 0, 0)));
                // zoom 1
                pyramid.add(new Tile(new Coord(1, 0, 0)));
                pyramid.add(new Tile(new Coord(1, 1, 0)));
                pyramid.add(new Tile(new Coord(1, 1, 1)));
                pyramid.add(new Tile(new Coord(1, 0, 1)));
                assert(pyramid.getAncestors(new Coord(1, 0, 0)).length === 1);
                assert(pyramid.getAncestors(new Coord(1, 1, 0)).length === 1);
                assert(pyramid.getAncestors(new Coord(1, 1, 1)).length === 1);
                assert(pyramid.getAncestors(new Coord(1, 0, 1)).length === 1);
                // zoom 2
                pyramid.add(new Tile(new Coord(2, 0, 0)));
                pyramid.add(new Tile(new Coord(2, 1, 0)));
                pyramid.add(new Tile(new Coord(2, 1, 1)));
                pyramid.add(new Tile(new Coord(2, 0, 1)));
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
