(function() {

    'use strict';

    const esper = require('esper');
    const glm = require('gl-matrix');
    const EventEmitter = require('events');
    const Event = require('./Event');
    const Enum = require('./Enum');
    const Coord = require('./Coord');
    const Tile = require('./Tile');
    const Const = require('./Const');
    const Bounds = require('./Bounds');
    const ZoomAnimation = require('./ZoomAnimation');

    // Private Methods

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

    const getVisibleTiles = function(tileSize, viewport, viewportPx, zoom) {
        const dim = Math.pow(2, zoom);
        // TODO: add wrap-around logic here
        const bounds = new Bounds(
            Math.floor(Math.max(0, viewportPx[0] / tileSize)),
            Math.ceil(Math.min(dim, (viewportPx[0] + viewport[0]) / tileSize)),
            Math.floor(Math.max(0, viewportPx[1] / tileSize)),
            Math.ceil(Math.min(dim, (viewportPx[1] + viewport[1]) / tileSize)));
        // TODO: pre-allocate this and index
        let coords = [];
        for (let x=bounds.left; x<bounds.right; x++) {
            for (let y=bounds.bottom; y<bounds.top; y++) {
                coords.push(new Coord(zoom, x, y));
            }
        }
        return coords;
    };

    const requestTiles = function(plot, viewport, viewportPx, zoom) {
        let coords = getVisibleTiles(plot.tileSize, viewport, viewportPx, zoom);
        plot.layers.forEach(layer => {
            // remove coords for tiles we already have, or are currently pending
            const pendingCoords = coords.filter(coord => {
                return !layer.tiles.has(coord) && !layer.pendingTiles.has(coord.hash);
            });
            // create tile objects
            // TODO: use a pre-allocated pool
            const pendingTiles = pendingCoords.map(coord => {
                return new Tile(coord);
            });
            // request tiles
            pendingTiles.forEach(tile => {
                const coord = tile.coord;
                // add tile to pending array
                layer.pendingTiles.set(coord.hash, tile);
                // emit request
                layer.emit(Event.TILE_REQUEST, tile);
                // request tile
                layer.requestTile(coord, (err, data) => {
                    // timestamp the tile
                    tile.timestamp = Date.now();
                    // remove tile from pending
                    layer.pendingTiles.delete(coord.hash);
                    // add to tile pyramid
                    layer.tiles.add(tile);

                    // prune tiles above / below once the tile has faded in
                    // TODO: fix this so it supports tiles more than 1 zoom
                    // away
                    layer.tiles.pruneTiles(plot, tile);

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
        let coords = getVisibleTiles(plot.tileSize, viewport, viewportPx, zoom);
        plot.layers.forEach(layer => {
            // create map to track removeable tiles
            const removableTiles = new Map(layer.tiles.map);
            // remove all tiles from this map that are in view
            coords.forEach(coord => {
                removableTiles.delete(coord.hash);
            });
            // remove the removeable tiles
            removableTiles.forEach(tile => {
                // remove the tile
                layer.tiles.remove(tile);
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

            // store prev zoom
            plot.prevZoom = plot.zoom;

            // set zoom direction
            plot.zoomDirection = (plot.zoom < plot.targetZoom) ? Enum.ZOOM_IN : Enum.ZOOM_OUT;

            // request tiles
            requestTiles(plot, plot.viewport, viewportTo, plot.targetZoom);
        }
    };

    const zoomOut = function(plot) {
        if (plot.zoomAnimation || plot.targetZoom <= plot.minZoom) {
            return;
        }
        plot.targetZoom-=2;
        zoom(plot);
    };

    const zoomIn = function(plot) {
        if (plot.zoomAnimation || plot.targetZoom >= plot.maxZoom) {
            return;
        }
        plot.targetZoom+=2;
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
            // apply the zoom animation
            plot.zoomAnimation.updatePlot(plot, timestamp);
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

            this.minZoom = Math.max(Const.MIN_ZOOM, options.minZoom || Const.MIN_ZOOM);
            this.maxZoom = Math.min(Const.MAX_ZOOM, options.maxZoom || Const.MAX_ZOOM);
            this.zoom = Math.min(Const.MAX_ZOOM, Math.max(Const.MIN_ZOOM, options.zoom || 0));
            this.prevZoom = this.zoom;
            this.targetZoom = this.zoom;
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
