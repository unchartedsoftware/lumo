'use strict';

const throttle = require('lodash/throttle');

// Constants

/**
 * Zoom request throttle in milliseconds.
 * @private
 * @constant {Number}
 */
const ZOOM_REQUEST_THROTTLE_MS = 400;

/**
 * Pan request throttle in milliseconds.
 * @private
 * @constant {Number}
 */
const PAN_REQUEST_THROTTLE_MS = 100;

// Private

const requestTiles = function(plot) {
	// get all visible coords in the target viewport
	const coords = plot.getVisibleCoords();
	// for each layer
	plot.layers.forEach(layer => {
		// request tiles
		layer.requestTiles(coords);
	});
};

module.exports = {
	requestTiles: requestTiles,
	panRequest: throttle(requestTiles, PAN_REQUEST_THROTTLE_MS),
	zoomRequest: throttle(requestTiles, ZOOM_REQUEST_THROTTLE_MS)
};
