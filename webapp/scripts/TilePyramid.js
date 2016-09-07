(function() {

    'use strict';

    const Bounds = require('./Bounds');
    const Const = require('./Const');
    const Coord = require('./Coord');
    const Enum = require('./Enum');
    const Event = require('./Event');
    const Tile = require('./Tile');

    // Private Methods

    const getVisibleDescendants = function(coord, tileSize, viewport, viewportPx, zoom, descZoom) {
        const currentScale = Math.pow(2, zoom - descZoom);
        const descDim = Math.pow(2, descZoom);
        const scaledTileSize = tileSize * currentScale;
        // get the tile bounds for descendant zoom tiles scaled at the current
        // zoom in the current viewport.
        // Ex. if current zoom is 3 and descenants are at zoom 5, get the
        // tile bounds for tiles at zoom 5 scaled to the current zoom of 3.
        const tileBounds = new Bounds(
            Math.floor(Math.max(0, viewportPx[0] / scaledTileSize)),
            Math.ceil(Math.min(descDim, (viewportPx[0] + viewport[0]) / scaledTileSize)),
            Math.floor(Math.max(0, viewportPx[1] / scaledTileSize)),
            Math.ceil(Math.min(descDim, (viewportPx[1] + viewport[1]) / scaledTileSize)));
        // get the tile bounds for the descenant tiles
        // Ex. if ancestor is (0,0,0), and descendant zoom is 2, get bounds from
        // [0 : 4) over both axes.
        const descScale = Math.pow(2, descZoom - coord.z);
        const descBounds = new Bounds(
            coord.x * descScale,
            coord.x * descScale + descScale,
            coord.y * descScale,
            coord.y * descScale + descScale);
        // get the intersection of the two bounds
        const intersection = tileBounds.intersection(descBounds);
        const coords = [];
        if (intersection) {
            for (let x=intersection.left; x<intersection.right; x++) {
                for (let y=intersection.bottom; y<intersection.top; y++) {
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
            this.activeLevels = new Map();
            this.timeouts = new Map();
            this.pending = new Map();
            this.numTiles = 0;
        }
        add(tile) {
            this.levels[tile.coord.z].push(tile);
            this.map.set(tile.coord.hash, tile);
            this.activeLevels.set(tile.coord.z, true);
            this.numTiles++;
            this.layer.emit(Event.TILE_ADD, tile);
        }
        remove(tile) {
            const index = this.levels[tile.coord.z].indexOf(tile);
            if (index >= 0) {
                this.levels[tile.coord.z].splice(index, 1);
                this.map.delete(tile.coord.hash);
                if (this.levels[tile.coord.z].length === 0) {
                    this.activeLevels.delete(tile.coord.z);
                }
                this.numTiles--;
                this.layer.emit(Event.TILE_REMOVE, tile);
            }
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
        getDescendants(parent) {
            const descendants = [];
            this.activeLevels.forEach((_, level) => {
                // only check levels that are descendants of the tile
                if (level > parent.coord.z) {
                    // check existing tiles, this bounds the number of tiles
                    // that are required to be tested
                    this.levels[level].forEach(tile => {
                        if (parent.coord.isParentOf(tile.coord)) {
                            descendants.push(tile);
                        }
                    });
                }
            });
            return descendants;
        }
        getAncestors(child) {
            const ancestors = [];
            this.activeLevels.forEach((_, level) => {
                // only check levels that are ascendents of the tile
                if (level < child.coord.z) {
                    // check existing tiles, this bounds the number of tiles
                    // that are required to be tested
                    this.levels[level].forEach(tile => {
                        if (child.coord.isChildOf(tile.coord)) {
                            ancestors.push(tile);
                        }
                    });
                }
            });
            return ancestors;
        }
        getNonVisibleTiles(plot) {
            const nonVisible = [];
            this.map.forEach(tile => {
                const inView = tile.coord.isInView(
                    plot.tileSize,
                    plot.zoom,
                    plot.viewport,
                    plot.viewportPx);
                if (!inView) {
                    nonVisible.push(tile);
                }
            });
            return nonVisible;
        }
        getVisibleTiles(plot) {
            const visible = [];
            this.map.forEach(tile => {
                const inView = tile.coord.isInView(
                    plot.tileSize,
                    plot.zoom,
                    plot.viewport,
                    plot.viewportPx);
                if (inView) {
                    visible.push(tile);
                }
            });
            return visible;
        }
        isOccludedByDescendants(plot, tile) {
            // determine what in-view descendants are required at the current zoom
            // to fully occlude this tile
            let occluded = false;
            // TODO: shot circuit this loop
            this.activeLevels.forEach((_, level) => {
                if (!occluded && level > tile.coord.z) {
                    // get all visible descendants
                    const visibleDescendants = getVisibleDescendants(
                        tile.coord,
                        plot.tileSize,
                        plot.viewport,
                        plot.targetViewportPx,
                        plot.targetZoom,
                        level);
                    // are all visible descendants here?
                    // TODO: short circuit this loop
                    const available = visibleDescendants.filter(descendant => {
                        return this.map.has(descendant.hash);
                    });
                    // all occluding descendants are present
                    if (available.length === visibleDescendants.length) {
                        occluded = true;
                    }
                }
            });
            return occluded;
        }
        isStale(plot, tile) {

            // NAIVE: ignore any tiles that aren't on the current zoom
            //return (tile.coord.z !== plot.targetZoom);

            // tile is stale if:
            //     1) plot.zoom < tile.coord.z AND there is an ancestor present with ancestor.coord.z < tile.coord.z
            //     2) OR plot.zoom > tile.coord.z AND is occluded by all descendants

            // 1) plot.zoom < tile.coord.z AND there is an ancestor present with ancestor.coord.z < tile.coord.z
            if (plot.targetZoom < tile.coord.z) {
                const ancestors = this.getAncestors(tile);
                return ancestors.some(ancestor => {
                    return (ancestor.coord.z <= tile.coord.z);
                });
            }

            // 2) OR plot.zoom > tile.coord.z AND is occluded by all descendants
            if (plot.targetZoom > tile.coord.z) {
                return this.isOccludedByDescendants(plot, tile);
            }

            // is not stale
            return false;
        }
        panRequestTiles(plot, coords) {
            // request tiles
            coords.forEach(coord => {
                // if we already have the tile, or it's currently pending
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
                    // timestamp the tile
                    tile.timestamp = Date.now();
                    // remove tile from pending
                    this.pending.delete(coord.hash);

                    // check if tile is stale
                    if (this.isStale(plot, tile)) {
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
                // if tile is currently pending
                if (this.isPending(coord)) {
                    return;
                }
                // if we already have the tile, refresh the tile
                if (this.has(coord)) {
                    const tile = this.get(coord);
                    tile.timestamp = Date.now();
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
                    if (this.isStale(plot, tile)) {
                        // discard tile if it is stale
                        this.layer.emit(Event.TILE_DISCARD, tile);
                    } else {
                        // add to tile pyramid
                        this.add(tile);
                    }

                    // prune tiles above / below once the tile has faded in
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
            //     1) ancestor is out of view
            //     2) plot.targetZoom > ancestor.coord.z AND have ALL occluding tiles in view

            // get all ancestors
            const ancestors = this.getAncestors(tile);
            ancestors.forEach(ancestor => {
                // TODO: confirm this is not needed / can never be true
                // // 1) ancestor is out of view
                // const inView = ancestor.coord.isInView(
                //     plot.tileSize,
                //     plot.targetZoom,
                //     plot.viewport,
                //     plot.targetViewportPx);
                // if (!inView) {
                //     this.remove(ancestor);
                //     return;
                // }

                // 2) plot.targetZoom > ancestor.coord.z AND have ALL occluding tiles in view
                if (this.isOccludedByDescendants(plot, ancestor)) {
                    // execute once tile finishes fading in
                    tile.onFadeIn(() => {
                        if (plot.targetZoom > ancestor.coord.z) {
                            this.remove(ancestor);
                        }
                    });
                }
            });
        }
        pruneDescendants(plot, tile) {

            // prune DESCENDANTS if:
            //     1) plot.targetZoom < descendant.coord.z
            //     2) descendant is out of view

            // execute once tile finishes fading in
            tile.onFadeIn(() => {
                const descendants = this.getDescendants(tile);
                descendants.forEach(descendant => {
                    // 1) plot.targetZoom < descendant.coord.z
                    if (plot.targetZoom < descendant.coord.z) {
                        this.remove(descendant);
                        return;
                    }
                    // TODO: confirm this is not needed / can never be true
                    // // 2) descendant is out of view
                    // const inView = descendant.coord.isInView(
                    //     plot.tileSize,
                    //     plot.targetZoom,
                    //     plot.viewport,
                    //     plot.targetViewportPx);
                    // if (!inView) {
                    //     this.remove(descendant);
                    // }
                });
            });
        }
        pruneOutOfView(plot, zoom, viewport, viewportPx) {
            // checks all tiles, if it is outside of the viewport, remove it
            this.map.forEach(tile => {
                const inView = tile.coord.isInView(
                    plot.tileSize,
                    zoom,
                    viewport,
                    viewportPx);
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
