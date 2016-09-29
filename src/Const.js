(function() {

    'use strict';

    module.exports = {
        // tile
        TILE_CACHE_SIZE: 128,
        // zoom
        MAX_CONCURRENT_ZOOMS: 4,
        MIN_ZOOM: 0,
        MAX_ZOOM: 30,
        ZOOM_WHEEL_DELTA: 200,
        ZOOM_ANIMATION_MS: 250,
        ZOOM_DEBOUNCE: 100,
        ZOOM_REQUEST_THROTTLE: 200,
        // pan
        PAN_CANCEL_DELAY: 50,
        PAN_REQUEST_THROTTLE: 50,
        // resize
        RESIZE_THROTTLE: 200,
        // persistance
        PERSISTANT_LEVELS: 4
    };

}());
