(function() {

    'use strict';

    const LRU = require('lru-cache');
    const Const = require('./Const');
    const Coord = require('./Coord');
    const Enum = require('./Enum');
    const Event = require('./Event');
    const Tile = require('./Tile');

    // Private Methods

    const getVisibleDescendants = function(ancestor, tileSize, viewport, viewportZoom, descZoom) {
        // get the tile coordinate bounds for tiles from the descZoom that
        // are visible from the viewportZoom.
        //     Ex. if current viewport zoom is 3 and tile zoom is 5, the
        //         tiles will be 25% of there normal size compared to the
        //         viewport.
        const tileBounds = viewport.getTileBounds(tileSize, viewportZoom, descZoom);
        // get the tile bounds for the descenant tiles
        //     Ex. if ancestor is (0,0,0), and descendant zoom is 2, get bounds
        //         of [0 : 3] for both axes.
        const descBounds = ancestor.getDescendantTileBounds(descZoom);
        // get the intersection of the two bounds
        const intersection = tileBounds.intersection(descBounds);
        const coords = [];
        if (intersection) {
            for (let x=intersection.left; x<=intersection.right; x++) {
                for (let y=intersection.bottom; y<=intersection.top; y++) {
                    coords.push(new Coord(descZoom, x, y));
                }
            }
        }
        return coords;
    };

    // Class / Public Methods

    class TilePyramid {
        constructor(layer) {
            if (!layer) {
                throw 'No layer parameter provided';
            }
            this.layer = layer;
            this.levels = [];
            for (let i=Const.MIN_ZOOM; i<=Const.MAX_ZOOM; i++) {
                this.levels[i] = [];
            }
            this.map = new Map();
            this.cache = new LRU(Const.TILE_CACHE_SIZE);
            this.activeLevels = new Map();
            this.pending = new Map();
            this.numTiles = 0;
        }
        add(tile) {
            if (this.map.has(tile.coord.hash)) {
                throw `Tile of coord ${tile.coord.hash} already exists in the pyramid`;
            }
            this.levels[tile.coord.z].push(tile);
            this.map.set(tile.coord.hash, tile);
            this.activeLevels.set(tile.coord.z, true);
            this.numTiles++;
            this.cache.del(tile.coord.hash);
            this.layer.emit(Event.TILE_ADD, tile);
        }
        remove(tile) {
            if (!this.map.has(tile.coord.hash)) {
                throw `Tile of coord ${tile.coord.hash} does not exists in the pyramid`;
            }
            const index = this.levels[tile.coord.z].indexOf(tile);
            this.levels[tile.coord.z].splice(index, 1);
            this.map.delete(tile.coord.hash);
            if (this.levels[tile.coord.z].length === 0) {
                this.activeLevels.delete(tile.coord.z);
            }
            this.numTiles--;
            this.cache.set(tile.coord.hash, tile);
            this.layer.emit(Event.TILE_REMOVE, tile);
        }
        has(coord) {
            return this.map.has(coord.hash);
        }
        isPending(coord) {
            return this.pending.has(coord.hash);
        }
        get(coord) {
            return this.map.get(coord.hash);
        }
        forEach(fn) {
            this.map.forEach(fn);
        }
        tiles(order = Enum.SORT_ASC) {
            const tiles = [];
            this.map.forEach(tile => {
                tiles.push(tile);
            });
            if (order === Enum.SORT_ASC) {
                tiles.sort((a, b) => {
                    return a.coord.z - b.coord.z;
                });
            } else {
                tiles.sort((a, b) => {
                    return b.coord.z - a.coord.z;
                });
            }
            return tiles;
        }
        getDescendants(coord) {
            const descendants = [];
            this.activeLevels.forEach((_, level) => {
                // only check levels that are descendants of the tile
                if (level > coord.z) {
                    // check existing tiles, this bounds the number of tiles
                    // that are required to be tested
                    this.levels[level].forEach(tile => {
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
            this.activeLevels.forEach((_, level) => {
                // only check levels that are ascendents of the tile
                if (level < coord.z) {
                    // check existing tiles, this bounds the number of tiles
                    // that are required to be tested
                    this.levels[level].forEach(tile => {
                        if (coord.isChildOf(tile.coord)) {
                            ancestors.push(tile);
                        }
                    });
                }
            });
            return ancestors;
        }
        isOccludedByDescendants(tileSize, zoom, viewport, coord) {
            // determine what in-view descendants are required at the current zoom
            // to fully occlude this tile
            const levels = this.activeLevels.keys();
            for (let level of levels) {
                // only check descendant levels
                if (level > coord.z) {
                    if (level - coord.z > Const.ZOOM_CULL_DIST) {
                        // prune if distance is too far, otherwise the
                        // computational space explodes
                        return true;
                    }
                    // get all visible descendants
                    const visibleDescendants = getVisibleDescendants(
                        coord,
                        tileSize,
                        viewport,
                        zoom,
                        level);
                    // are all visible descendants here?
                    const available = visibleDescendants.filter(descendant => {
                        return this.map.has(descendant.hash);
                    });
                    // all occluding descendants are present
                    if (available.length === visibleDescendants.length) {
                        return true;
                    }
                }
            }
            return false;
        }
        isStale(tileSize, zoom, viewport, coord) {

            // coord is stale if:
            //     1) coord is not in view at the TARGET viewport / zoom
            //     2) zoom < coord.z AND there is an ancestor present
            //        with ancestor.coord.z < coord.z
            //     3) OR zoom > coord.z AND is occluded by all
            //        descendants

            // 1) coord is not in view at the TARGET viewport / zoom
            const inView = coord.isInView(
                tileSize,
                zoom,
                viewport);
            if (!inView) {
                return true;
            }

            // 2) zoom < coord.z AND there is an ancestor present with
            //    ancestor.coord.z < coord.z
            if (zoom < coord.z) {
                // discard if the zoom difference exceeds the cull distance
                if ((coord.z - zoom) > Const.ZOOM_CULL_DIST) {
                    return true;
                }
                const ancestors = this.getAncestors(coord);
                return ancestors.some(ancestor => {
                    return (ancestor.coord.z <= coord.z);
                });
            }

            // 3) OR zoom > coord.z AND is occluded by all descendants
            if (zoom > coord.z) {
                // discard if zoom the difference exceeds the cull distance
                if ((zoom - coord.z) > Const.ZOOM_CULL_DIST) {
                    return true;
                }
                // check if it is occluded by it's descendants
                return this.isOccludedByDescendants(
                    tileSize,
                    zoom,
                    viewport,
                    coord);
            }

            // is not stale
            return false;
        }
        panRequestTiles(plot, coords) {
            // request tiles
            coords.forEach(coord => {
                // we already have the tile, or it's currently pending
                if (this.has(coord) || this.isPending(coord)) {
                    return;
                }
                // if we have the tile in the cache, add it
                if (this.cache.has(coord.hash)) {
                    // get from cache
                    const tile = this.cache.get(coord.hash);
                    tile.timestamp = Date.now();
                    this.add(tile);
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
                    // timestamp the tile
                    tile.timestamp = Date.now();
                    // remove tile from pending
                    this.pending.delete(coord.hash);

                    // check if tile is stale
                    if (this.isStale(
                        plot.tileSize,
                        plot.targetZoom,
                        plot.targetViewport,
                        coord)) {
                        // discard tile if it is stale
                        this.layer.emit(Event.TILE_DISCARD, tile);
                    } else {
                        // add to tile pyramid
                        this.add(tile);
                    }

                    // check err
                    if (err !== null) {
                        // add err
                        tile.err = err;
                        // emit failure
                        this.layer.emit(Event.TILE_FAILURE, tile);
                        return;
                    }
                    // add data
                    tile.data = data;
                    // emit success
                    this.layer.emit(Event.TILE_SUCCESS, tile);
                });
            });
        }
        zoomRequestTiles(plot, coords) {
            // request tiles
            coords.forEach(coord => {
                // if tile is currently pending, wait for it
                if (this.isPending(coord)) {
                    return;
                }
                // if we already have the tile, refresh it
                if (this.has(coord)) {
                    const tile = this.get(coord);
                    tile.timestamp = Date.now();
                    this.pruneTiles(plot, tile);
                    return;
                }
                // if we have the tile in the cache, add it
                if (this.cache.has(coord.hash)) {
                    // add to tile pyramid
                    const tile = this.cache.get(coord.hash);
                    tile.timestamp = Date.now();
                    this.add(tile);
                    // prune tiles above / below
                    this.pruneTiles(plot, tile);
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
                    // timestamp the tile
                    tile.timestamp = Date.now();
                    // remove tile from pending
                    this.pending.delete(coord.hash);

                    // check if tile is stale
                    if (this.isStale(
                        plot.tileSize,
                        plot.targetZoom,
                        plot.targetViewport,
                        coord)) {
                        // discard tile if it is stale
                        this.layer.emit(Event.TILE_DISCARD, tile);
                        // TODO: should we continue and prune from this tile?
                        // return;
                    } else {
                        // add to tile pyramid
                        this.add(tile);
                    }

                    // prune tiles above / below
                    this.pruneTiles(plot, tile);

                    // check err
                    if (err !== null) {
                        // add err
                        tile.err = err;
                        // emit failure
                        this.layer.emit(Event.TILE_FAILURE, tile);
                        return;
                    }
                    // add data
                    tile.data = data;
                    // emit success
                    this.layer.emit(Event.TILE_SUCCESS, tile);
                });
            });
        }
        pruneAncestors(plot, tile) {

            // prune ANCESTOR when:
            //     1) all occluding tiles in view
            //     2) zoom > ancestor.coord.z AND have ALL occluding tiles in view

            // get all ancestors
            const ancestors = this.getAncestors(tile.coord);
            ancestors.forEach(ancestor => {
                // 1) plot.targetZoom > ancestor.coord.z AND have ALL occluding tiles in view
                if (this.isOccludedByDescendants(
                    plot.tileSize,
                    plot.targetZoom,
                    plot.targetViewport,
                    ancestor.coord)) {
                    // execute once tile finishes fading in
                    tile.onFadeIn(() => {
                        // 2) zoom > ancestor.coord.z
                        if (this.has(ancestor.coord) && plot.targetZoom > ancestor.coord.z) {
                            this.remove(ancestor);
                        }
                    });
                }
            });
        }
        pruneDescendants(plot, tile) {

            // prune DESCENDANTS if:
            //    1) zoom < descendant.coord.z

            // execute once tile finishes fading in
            tile.onFadeIn(() => {
                const descendants = this.getDescendants(tile.coord);
                descendants.forEach(descendant => {
                    // 1) zoom < descendant.coord.z
                    if (plot.targetZoom < descendant.coord.z) {
                        this.remove(descendant);
                        return;
                    }
                });
            });
        }
        pruneOutOfView(tileSize, zoom, viewport) {
            // checks all tiles, if it is outside of the viewport, remove it
            this.map.forEach(tile => {
                const inView = tile.coord.isInView(
                    tileSize,
                    zoom,
                    viewport);
                if (!inView) {
                    this.remove(tile);
                }
            });
        }
        pruneTiles(plot, tile) {
            this.pruneAncestors(plot, tile);
            this.pruneDescendants(plot, tile);
        }
    }

    module.exports = TilePyramid;

}());
