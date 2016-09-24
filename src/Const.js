(function() {

    'use strict';

    module.exports = {
        // tile
        TILE_FADE_MS: 200,
        TILE_CACHE_SIZE: 256,
        // zoom
        MAX_CONCURRENT_ZOOMS: 3,
        MIN_ZOOM: 0,
        MAX_ZOOM: 30,
        ZOOM_WHEEL_DELTA: 100,
        ZOOM_CULL_DIST: 4,
        ZOOM_ANIMATION_MS: 250,
        ZOOM_DEBOUNCE: 200,
        ZOOM_THROTTLE: 800,
        // pan
        PAN_REQUEST_THROTTLE: 100,
        PAN_PRUNE_THROTTLE: 2000,
        // resize
        RESIZE_THROTTLE: 200
    };

}());
