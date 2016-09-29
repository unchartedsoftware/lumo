(function() {

    'use strict';

    module.exports = {
        // pan
        PAN_START: 'pan:start',
        PAN: 'pan',
        PAN_END: 'pan:end',
        // zoom
        ZOOM_START: 'zoom:start',
        ZOOM_END: 'zoom:end',
        // resize
        RESIZE: 'resize',
        // tile
        // when the intial request is made, the tile is not yet part of the layer
        TILE_REQUEST: 'tile:request',
        // when the tile request completes unsuccessfully
        TILE_FAILURE: 'tile:failure',
        // when the tile is added to the layer, this occurs after a success / failure
        TILE_ADD: 'tile:add',
        // when the tile is removed from the layer
        TILE_REMOVE: 'tile:remove'
    };

}());
