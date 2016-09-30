(function() {

    'use strict';

    const defaultTo = require('lodash/defaultTo');
    const EventEmitter = require('events');
    const TilePyramid = require('./TilePyramid');

    // Class / Public Methods

    class Layer extends EventEmitter {
        constructor(options = {}) {
            super();
            this.renderer = defaultTo(options.renderer, null);
            this.opacity = defaultTo(options.opacity, 1.0);
            this.hidden = defaultTo(options.hidden, false);
            this.pyramid = new TilePyramid(this, options);
            this.plot = null;
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
            this.hidden = false;
        }
        hide() {
            this.hidden = true;
        }
        draw(timestamp) {
            if (this.renderer && !this.hidden) {
                this.renderer.draw(timestamp);
            }
        }
        requestTile(tile, done) {
            done(null, tile);
        }
    }

    module.exports = Layer;

}());
