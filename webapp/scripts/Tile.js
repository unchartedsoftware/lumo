(function() {

    'use strict';

    const Const = require('./Const');

    // Private Methods

    // Class / Public Methods

    class Tile {
        constructor(coord) {
            this.coord = coord;
            this.data = null;
            this.err = null;
            this.timestamp = null;
        }
        opacity(timestamp) {
            return Math.min(1.0, (timestamp - this.timestamp) / Const.TILE_FADE_MS);
        }
        onFadeIn(callback) {
            const diff = Date.now() - this.timestamp;
            const remainingDelay = Math.max(0, Const.TILE_FADE_MS - diff);
            if (remainingDelay <= 0) {
                callback();
            } else {
                setTimeout(callback, remainingDelay);
            }
        }
    }

    module.exports = Tile;

}());
