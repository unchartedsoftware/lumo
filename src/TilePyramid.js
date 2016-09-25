(function() {

    'use strict';

    const LRU = require('lru-cache');
    const Const = require('./Const');
    const Event = require('./Event');
    const Tile = require('./Tile');

    // Private Methods

    const add = function(pyramid, tile) {
        if (tile.coord.z <= Const.PERSISTANT_LEVELS) {
            // persistant tiles
            if (pyramid.persistants.has(tile.coord.hash)) {
                throw `Tile of coord ${tile.coord.hash} already exists in the pyramid`;
            }
            pyramid.persistants.set(tile.coord.hash, tile);
        } else {
            // non-persistant tiles
            if (pyramid.tiles.has(tile.coord.hash)) {
                throw `Tile of coord ${tile.coord.hash} already exists in the pyramid`;
            }
            pyramid.tiles.set(tile.coord.hash, tile);
        }
        // store in level arrays
        if (!pyramid.levels.has(tile.coord.z)) {
            pyramid.levels.set(tile.coord.z, []);
        }
        pyramid.levels.get(tile.coord.z).push(tile);
        // emit add
        pyramid.layer.emit(Event.TILE_ADD, tile);
    };

    const remove = function(pyramid, tile) {
        if (tile.coord.z <= Const.PERSISTANT_LEVELS) {
            throw `Tile of coord ${tile.coord.hash} is flagged as persistant and cannot be removed`;
        }
        if (!pyramid.tiles.has(tile.coord.hash)) {
            throw `Tile of coord ${tile.coord.hash} does not exists in the pyramid`;
        }
        // remove from levels
        const level = pyramid.levels.get(tile.coord.z);
        level.splice(level.indexOf(tile), 1);
        if (level.length === 0) {
            pyramid.levels.delete(tile.coord.z);
        }
        // emit remove
        pyramid.layer.emit(Event.TILE_REMOVE, tile);
    };

    // Class / Public Methods

    class TilePyramid {
        constructor(layer) {
            if (!layer) {
                throw 'No layer parameter provided';
            }
            this.layer = layer;
            this.levels = new Map();
            this.persistants = new Map();
            this.pending = new Map();
            this.tiles = new LRU({
                max: Const.TILE_CACHE_SIZE,
                dispose: (key, tile) => {
                    remove(this, tile);
                }
            });
        }
        has(coord) {
            if (coord.z <= Const.PERSISTANT_LEVELS) {
                return this.persistants.has(coord.hash);
            }
            return this.tiles.has(coord.hash);
        }
        isPending(coord) {
            return this.pending.has(coord.hash);
        }
        get(coord) {
            if (coord.z <= Const.PERSISTANT_LEVELS) {
                return this.persistants.get(coord.hash);
            }
            return this.tiles.get(coord.hash);
        }
        getDescendants(coord) {
            const descendants = [];
            this.levels.forEach((tiles, level) => {
                // only check levels that are descendants of the tile
                if (level > coord.z) {
                    // check existing tiles, this bounds the number of tiles
                    // that are required to be tested
                    tiles.forEach(tile => {
                        if (coord.isParentOf(tile.coord)) {
                            descendants.push(tile);
                        }
                    });
                }
            });
            return descendants;
        }
        getAncestors(coord) {
            const ancestors = [];
            this.levels.forEach((tiles, level) => {
                // only check levels that are ascendents of the tile
                if (level < coord.z) {
                    // check existing tiles, this bounds the number of tiles
                    // that are required to be tested
                    tiles.forEach(tile => {
                        if (coord.isChildOf(tile.coord)) {
                            ancestors.push(tile);
                        }
                    });
                }
            });
            return ancestors;
        }
        getClosestAncestor(coord) {
            // get ancestors levels, in descending order
            const levels = [...this.levels.keys()]
                .sort((a, b) => {
                    // sort by key
                	return b - a;
                }).filter(entry => {
                    // filter by key
                    return (entry < coord.z);
                });
            // get active levels
            for (let i=0; i<levels.length; i++) {
                const level = levels[i];
                const ancestor = coord.getAncestor(coord.z - level);
                if (this.has(ancestor)) {
                    return ancestor;
                }
            }
            return null;
        }
        requestTiles(coords) {
            // request tiles
            coords.forEach(coord => {
                // we already have the tile, or it's currently pending
                if (this.has(coord) || this.isPending(coord)) {
                    return;
                }
                // create the new tile
                const tile = new Tile(coord);
                // add tile to pending array
                this.pending.set(coord.hash, tile);
                // emit request
                this.layer.emit(Event.TILE_REQUEST, tile);
                // request tile
                this.layer.requestTile(coord, (err, data) => {
                    // remove tile from pending
                    this.pending.delete(coord.hash);
                    // check err
                    if (err !== null) {
                        // add err
                        tile.err = err;
                        // emit failure
                        this.layer.emit(Event.TILE_FAILURE, tile);
                        return;
                    }
                    // timestamp the tile
                    tile.timestamp = Date.now();
                    // add data
                    tile.data = data;
                    // add to tile pyramid
                    add(this, tile);
                });
            });
        }
    }

    module.exports = TilePyramid;

}());
