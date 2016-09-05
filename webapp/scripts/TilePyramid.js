(function() {

    'use strict';

    const Bounds = require('./Bounds');
    const Const = require('./Const');
    const Coord = require('./Coord');
    const Enum = require('./Enum');
    const Event = require('./Event');

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
            for (let i=Const.MIN_ZOOM; i<Const.MAX_ZOOM; i++) {
                this.levels[i] = [];
            }
            this.map = new Map();
            this.activeLevels = new Map();
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
        forEach(fn) {
            this.map.forEach(fn);
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
        // getNonVisibleTiles(plot) {
        //     const zoom = (plot.zoomAnimation) ? plot.zoomAnimation.zoom(Date.now()) : plot.zoom;
        //     const nonVisible = [];
        //     this.map.forEach(tile => {
        //         const inView = tile.coord.isInView(
        //             plot.tileSize,
        //             zoom,
        //             plot.viewport,
        //             plot.viewportPx);
        //         if (!inView) {
        //             nonVisible.push(tile);
        //         }
        //     });
        //     return nonVisible;
        // }
        // getVisibleTiles(plot) {
        //     const zoom = (plot.zoomAnimation) ? plot.zoomAnimation.zoom(Date.now()) : plot.zoom;
        //     const visible = [];
        //     this.map.forEach(tile => {
        //         const inView = tile.coord.isInView(
        //             plot.tileSize,
        //             zoom,
        //             plot.viewport,
        //             plot.viewportPx);
        //         if (inView) {
        //             visible.push(tile);
        //         }
        //     });
        //     return visible;
        // }
        pruneTiles(plot, tile) {
            if (plot.zoomDirection === Enum.ZOOM_IN) {
                const zoom = (plot.zoomAnimation) ? plot.zoomAnimation.zoom(tile.timestamp) : plot.zoom;
                // get all ancestors
                const ancestors = this.getAncestors(tile);

                ancestors.forEach(ancestor => {
                    // check if out of view
                    const inView = ancestor.coord.isInView(
                        plot.tileSize,
                        zoom,
                        plot.viewport,
                        plot.viewportPx);
                    // if ancestor is not in view, get rid of it
                    if (!inView) {
                        this.remove(ancestor);
                        return;
                    }
                    // determine what in view descendants are required at the
                    // current zoom to remove this tile
                    let readyToRemove = false;
                    this.activeLevels.forEach((_, level) => {
                        if (!readyToRemove && level > ancestor.coord.z) {
                            // get all visible descendants
                            // TODO: fix this so that it takes into account the current zoom
                            const visibleDescendants = getVisibleDescendants(
                                ancestor.coord,
                                plot.tileSize,
                                plot.viewport,
                                plot.viewportPx,
                                zoom,
                                level);
                            // are all visible descendants here?
                            // TODO: short circuit this
                            const available = visibleDescendants.filter(descendant => {
                                return this.map.has(descendant.hash);
                            });
                            // all descendants are present, we can remove the
                            // ancestor
                            if (available.length === visibleDescendants.length) {
                                readyToRemove = true;
                            }
                        }
                    });
                    if (readyToRemove) {
                        // remove ancestor once tile fades in
                        tile.onFadeIn(() => {
                            this.remove(ancestor);
                        });
                    }
                });
            } else {
                // remove children once tile finishes fading in
                tile.onFadeIn(() => {
                    // zooming out, remove all descendants
                    const descendants = this.getDescendants(tile);
                    descendants.forEach(descendant => {
                        this.remove(descendant);
                    });
                });
            }
        }
    }

    module.exports = TilePyramid;

}());
