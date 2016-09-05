(function() {

    'use strict';

    const EventEmitter = require('events');
    const TilePyramid = require('./TilePyramid');

    // Class / Public Methods

    class Layer extends EventEmitter {
        constructor(options = {}) {
            super();
            this.renderer = options.renderer;
            this.plot = null;
            this.tiles = new TilePyramid(this);
            this.pendingTiles = new Map();
        }
        activate(plot) {
            if (!plot) {
                throw 'No Plot provided';
            }
            this.plot = plot;
            this.renderer.activate(this);
        }
        deactivate(plot) {
            if (!plot) {
                throw 'No Plot provided';
            }
            this.plot = null;
            this.renderer.deactivate(this);
        }
        show() {

        }
        hide() {

        }
        requestTile(tile, done) {
            done(null, tile);
        }
    }

    module.exports = Layer;

}());
