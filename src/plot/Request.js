'use strict';

const throttle = require('lodash/throttle');
const Coord = require('../core/Coord');

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

const requestBaseTile = function(layer) {
	// request tiles
	layer.pyramid.requestTiles([
		new Coord(0, 0, 0)
	]);
};

const requestTiles = function(plot, viewport = plot.viewport, zoom = plot.zoom) {
	// get all visible coords in the target viewport
	const coords = viewport.getVisibleCoords(
		plot.tileSize,
		zoom,
		Math.round(zoom),
		plot.wraparound);
	// for each layer
	plot.layers.forEach(layer => {
		// request tiles
		layer.pyramid.requestTiles(coords);
	});
};

module.exports = {
	requestTiles: requestTiles,
	requestBaseTile: requestBaseTile,
	panRequest: throttle(requestTiles, PAN_REQUEST_THROTTLE_MS),
	zoomRequest: throttle(requestTiles, ZOOM_REQUEST_THROTTLE_MS)
};
