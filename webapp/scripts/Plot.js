(function() {

    'use strict';

    const esper = require('esper');
    const glm = require('gl-matrix');
    const EventEmitter = require('events');
    const Event = require('./Event');
    const Enum = require('./Enum');
    const Tile = require('./Tile');
    const Const = require('./Const');
    const ZoomAnimation = require('./ZoomAnimation');

    // Private Methods

    const hashCoord = function(coord) {
        return `${coord.z}-${coord.x}-${coord.y}`;
    };

    const mouseToViewPx = function(plot, event) {
        return glm.vec2.fromValues(
            event.clientX,
            plot.viewport[1] - event.clientY);
    };

    const viewPxToPlotPx = function(plot, px) {
        return glm.vec2.add(glm.vec2.create(), plot.viewportPx, px);
    };

    // const plotPxToViewPx = function(plot, px) {
    //     return glm.vec2.sub(glm.vec2.create(), px, plot.viewportPx);
    // };

    const mouseToPlotPx = function(plot, event) {
        return viewPxToPlotPx(plot, mouseToViewPx(plot, event));
    };

    const throttle = function(fn, delay, context = this) {
        let lock = false;
        let args;
        let wrapper;
        let unlock = function() {
            // reset lock and call if queued
            lock = false;
            if (args) {
                wrapper.apply(context, args);
                args = false;
            }
        };
        wrapper = function() {
            if (lock) {
                // called too soon, queue to call later
                args = arguments;
            } else {
                // call and lock until later
                fn.apply(context, arguments);
                setTimeout(unlock, delay);
                lock = true;
            }
        };
        return wrapper;
    };

    const getVisibleTiles = function(plot, viewport, viewportPx, zoom) {
        const x = viewportPx[0];
        const y = viewportPx[1];
        const width = viewport[0];
        const height = viewport[1];
        const tileSize = plot.tileSize;
        const dim = Math.pow(2, zoom);
        // TODO: add wrap-around logic here
        const xMin = Math.floor(Math.max(0, x / tileSize));
        const xMax = Math.ceil(Math.min(dim, (x + width) / tileSize));
        const yMin = Math.floor(Math.max(0, y / tileSize));
        const yMax = Math.ceil(Math.min(dim, (y + height) / tileSize));
        // TODO: pre-allocate this and index
        let coords = [];
        for (let i=xMin; i<xMax; i++) {
            for (let j=yMin; j<yMax; j++) {
                coords.push({
                    z: zoom,
                    x: i,
                    y: j,
                });
            }
        }
        return coords;
    };

    const getParentTile = function(coord) {
        return {
            z: coord.z - 1,
            x: Math.floor(coord.x / 2),
            y: Math.floor(coord.y / 2),
        };
    };

    const getChildTiles = function(coord) {
        const coords = [];
        for (let x=0; x<2; x++) {
            for (let y=0; y<2; y++) {
                coords.push({
                    z: coord.z + 1,
                    x: coord.x * 2 + x,
                    y: coord.y * 2 + y
                });
            }
        }
        return coords;
    };

    const getSiblingTiles = function(coord) {
        return getChildTiles(getParentTile(coord));
    };

    const pruneTiles = function(plot, layer, tile) {
        const coord = tile.coord;
        if (plot.zoomDirection === Enum.ZOOM_IN) {
            // if zooming in we remove the ones on top
            const siblings = getSiblingTiles(coord);
            let retrieved = 0;
            siblings.forEach(sibling => {
                const hash = hashCoord(sibling);
                if (layer.tiles.has(hash)) {
                    retrieved++;
                }
            });
            if (retrieved === 4) {
                // remove parent once tile finishes fading in
                tile.onFadeIn(() => {
                    const parent = getParentTile(coord);
                    const hash = hashCoord(parent);
                    if (layer.tiles.has(hash)) {
                        const tile = layer.tiles.get(hash);
                        // remove the tile
                        layer.tiles.delete(hash);
                        // emit remove
                        layer.emit(Event.TILE_REMOVE, tile);
                    }
                });
            }
        } else {
            // remove parent once tile finishes fading in
            tile.onFadeIn(() => {
                // zooming out, remove all children
                const children = getChildTiles(coord);
                children.forEach(child => {
                    const hash = hashCoord(child);
                    if (layer.tiles.has(hash)) {
                        const tile = layer.tiles.get(hash);
                        // remove the tile
                        layer.tiles.delete(hash);
                        // emit remove
                        layer.emit(Event.TILE_REMOVE, tile);
                    }
                });
            });
        }
    };

    const requestTiles = function(plot, viewport, viewportPx, zoom) {
        let coords = getVisibleTiles(plot, viewport, viewportPx, zoom);
        plot.layers.forEach(layer => {
            // remove coords for tiles we already have
            const pendingCoords = coords.filter(coord => {
                const hash = hashCoord(coord);
                return !layer.tiles.has(hash) && !layer.pendingTiles.has(hash);
            });
            // create tile objects
            // TODO: use a pre-allocated pool
            const pendingTiles = pendingCoords.map(coord => {
                return new Tile(coord);
            });
            // request tiles
            pendingTiles.forEach(tile => {
                const coord = tile.coord;
                const hash = hashCoord(coord);
                // add tile to pending array
                layer.pendingTiles.set(hash, tile);
                // emit request
                layer.emit(Event.TILE_REQUEST, tile);
                // request tile
                layer.requestTile(coord, (err, data) => {
                    // timestamp the tile
                    tile.timestamp = Date.now();
                    // remove tile from pending
                    layer.pendingTiles.delete(hash);
                    // add to tiles
                    layer.tiles.set(hash, tile);

                    // prune tiles above / below once the tile has faded in
                    // TODO: fix this so it supports tiles more than 1 zoom
                    // away
                    pruneTiles(plot, layer, tile);

                    // check err
                    if (err !== null) {
                        // add err
                        tile.err = err;
                        // emit failure
                        layer.emit(Event.TILE_FAILURE, tile);
                        return;
                    }
                    // add data
                    tile.data = data;
                    // emit success
                    layer.emit(Event.TILE_SUCCESS, tile);
                });
            });
        });
    };

    const removeTiles = function(plot, viewport, viewportPx, zoom) {
        let coords = getVisibleTiles(plot, viewport, viewportPx, zoom);
        plot.layers.forEach(layer => {
            // create map to track removeable tiles
            const removableTiles = new Map(layer.tiles);
            // remove all tiles from this map that are in view
            coords.forEach(coord => {
                const hash = hashCoord(coord);
                removableTiles.delete(hash);
            });
            // remove the removeable tiles
            removableTiles.forEach((tile, hash) => {
                // remove the tile
                layer.tiles.delete(hash);
                // emit remove
                layer.emit(Event.TILE_REMOVE, tile);
            });
        });
    };

    const updateTiles = throttle(function(plot) {
        removeTiles(plot, plot.viewport, plot.viewportPx, plot.zoom);
        requestTiles(plot, plot.viewport, plot.viewportPx, plot.zoom);
    }, Const.UPDATE_THROTTLE);

    const pan = function(plot, delta) {
        if (plot.zoomAnimation) {
            // no panning while zooming
            return;
        }
        plot.viewportPx = glm.vec2.sub(plot.viewportPx, plot.viewportPx, delta);
        plot.emit(Event.PAN, delta);
        updateTiles(plot);
    };

    // const center = function(plot, px) {
    //     const half = glm.vec2.fromValues(
    //         plot.viewport[0] / 2,
    //         plot.viewport[1] / 2);
    //     plot.viewportPx = glm.vec2.sub(plot.viewportPx, px, half);
    // };

    // TODO: implement a batch and delay. Batch up to N zooms, then delay
    const zoom = function(plot) {
        if (plot.zoom !== plot.targetZoom) {
            // get the current dimension
            const current = Math.pow(2, plot.zoom);
            // get the next dimension
            const next = Math.pow(2, plot.targetZoom);
            // determine the change in pixels to center the existing plot
            const change = plot.tileSize * (next - current) / 2;

            // get target viewport
            const viewportTo = glm.vec2.add(
                glm.vec2.create(),
                plot.viewportPx,
                glm.vec2.fromValues(change, change));

            // plot zoom timestamp
            plot.zoomAnimation = new ZoomAnimation({
                zoomFrom: plot.zoom,
                zoomTo: plot.targetZoom,
                viewportFrom: glm.vec2.clone(plot.viewportPx)
            });

            // set zoom direction
            plot.zoomDirection = (plot.zoom < plot.targetZoom) ? Enum.ZOOM_IN : Enum.ZOOM_OUT;

            // request tiles
            requestTiles(plot, plot.viewport, viewportTo, plot.targetZoom);
        }
    };

    const zoomOut = function(plot) {
        if (plot.zoomAnimation || plot.targetZoom === plot.minZoom) {
            return;
        }
        plot.targetZoom--;
        zoom(plot);
    };

    const zoomIn = function(plot) {
        if (plot.zoomAnimation || plot.targetZoom === plot.maxZoom) {
            return;
        }
        plot.targetZoom++;
        zoom(plot);
    };

    const resize = throttle(function(plot) {
        const width = plot.element.offsetWidth;
        const height = plot.element.offsetHeight;
        if (plot.viewport[0] !== width || plot.viewport[1] !== height) {
            // TODO: high res displays
            plot.element.width = width;
            plot.element.height = height;
            // update viewport
            plot.viewport[0] = width;
            plot.viewport[1] = height;
            // emit resize
            plot.emit(Event.RESIZE, {});
        }
    }, Const.RESIZE_THROTTLE);

    const render = function(plot) {
        // update size
        resize(plot);
        // get timestamp
        const timestamp = Date.now();
        // clear the backbuffer
        const gl = plot.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // enable depth testing
        gl.enable(gl.DEPTH_TEST);
        // enable blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        if (plot.zoomAnimation) {
            // animate the viewport
            plot.viewportPx = plot.zoomAnimation.viewportPx(plot, timestamp);
        }
        // render each layer
        plot.layers.forEach(layer => {
            if (layer.renderer) {
                layer.renderer.draw(timestamp);
            }
        });
        // remove animation once complete
        if (plot.zoomAnimation && plot.zoomAnimation.done()) {
            plot.zoomAnimation = null;
            plot.zoom = plot.targetZoom;
        }
        // request newxt animation frame
        plot.renderQuest = requestAnimationFrame(() => {
            render(plot);
        });
    };

    // Class / Public Methods

    class Plot extends EventEmitter {
        constructor(selector, options = {}) {
            super();
            this.element = document.querySelector(selector);
            if (!this.element) {
                throw `Element could not be found for selector ${selector}`;
            }
            try {
                this.gl = esper.WebGLContext.get(this.element);
            } catch(err) {
                throw `Unable to create a WebGLRenderingContext, please ensure your browser supports WebGL`;
            }

            // TODO: add resize callbacks
            this.element.width = this.element.offsetWidth;
            this.element.height = this.element.offsetHeight;
            this.width = this.element.width;
            this.height = this.element.height;

            this.layers = [];

            this.tileSize = 256;

            this.zoom = options.zoom || 0;
            this.minZoom = Math.max(Const.MIN_ZOOM, options.minZoom || Const.MIN_ZOOM);
            this.maxZoom = Math.min(Const.MAX_ZOOM, options.maxZoom || Const.MAX_ZOOM);
            this.targetZoom = this.zoom;
            this.targetZoomPx = glm.vec2.create();
            this.zoomDirection = Enum.ZOOM_IN;

            this.viewport = glm.vec2.fromValues(
                this.element.offsetWidth,
                this.element.offsetHeight);
            this.viewportPx = glm.vec2.create();

            this.tiles = new Map();
            this.pendingTiles = new Map();

            this.handlers = new Map();
            this.handlers.set('tileload', []);
            this.handlers.set('tileunload', []);

            this.events = new Map();
            this.events.set('tileload', tile => {
                this.handlers.get('tileload').forEach(handler => {
                    handler(tile);
                });
            });
            this.events.set('tileunload', tile => {
                this.handlers.get('tileunload').forEach(handler => {
                    handler(tile);
                });
            });

            let down = false;
            let last = null;
            this.element.addEventListener('mousedown', event => {
                down = true;
                last = mouseToViewPx(this, event);
            });
            document.addEventListener('mouseup', () => {
                down = false;
            });
            document.addEventListener('mousemove', event => {
                if (down) {
                    const current = mouseToViewPx(this, event);
                    const delta = glm.vec2.sub(glm.vec2.create(), current, last);
                    pan(this, delta);
                    last = current;
                }
            });

            this.element.addEventListener('dblclick', () => {
                this.targetZoomPlotPx = mouseToPlotPx(this, event);
                zoomIn(this);
            });

            this.element.addEventListener('wheel', event => {
                this.targetZoomPlotPx = mouseToPlotPx(this, event);
                if (event.deltaY > 0) {
                    zoomOut(this);
                } else {
                    zoomIn(this);
                }
            });

            // render loop
            this.renderRequest = null;
            render(this);
        }
        destroy() {
            // stop animation loop
            cancelAnimationFrame(this.renderRequest);
            this.renderRequest = null;
            // destroy context
            esper.WebGLContext.remove(this.element);
            this.gl = null;
            this.element = null;
        }
        add(layer) {
            if (!layer) {
                throw `No argument supplied`;
            }
            if (this.layers.indexOf(layer) < 0) {
                this.layers.push(layer);
                layer.activate(this);
            }
            requestTiles(this, this.viewport, this.viewportPx, this.zoom);
        }
        remove(layer) {
            if (!layer) {
                throw `No argument supplied`;
            }
            const index = this.layers.indexOf(layer);
            if (index >= 0) {
                this.layers.splice(index, 1);
                layer.deactivate(this);
            }
        }
    }

    module.exports = Plot;

}());
