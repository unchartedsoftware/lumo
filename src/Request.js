(function() {

    'use strict';

    const Const = require('./Const');
    const throttle = require('lodash/throttle');

    const requestTiles = function(plot) {
        // get all visible coords in the target viewport
        const coords = plot.targetViewport.getVisibleCoords(
            plot.tileSize,
            plot.targetZoom,
            Math.round(plot.targetZoom));
        // for each layer
        plot.layers.forEach(layer => {
            // request tiles
            layer.pyramid.requestTiles(coords);
        });
    };

    module.exports = {
        requestTiles: requestTiles,
        panRequest: throttle(requestTiles, Const.PAN_REQUEST_THROTTLE),
        zoomRequest: throttle(requestTiles, Const.ZOOM_REQUEST_THROTTLE)
    };

}());
