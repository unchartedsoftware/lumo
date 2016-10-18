'use strict';

const throttle = require('lodash/throttle');
const Coord = require('../core/Coord');

// Constants

/**
 * Zoom request throttle in milliseconds.
 * @constant {Number}
 */
const ZOOM_REQUEST_THROTTLE_MS = 200;

/**
 * Pan request throttle in milliseconds.
 * @constant {Number}
 */
const PAN_REQUEST_THROTTLE_MS = 50;

// Private

const requestBaseTile = function(plot, layer) {
	// request tiles
	layer.pyramid.requestTiles(plot, [
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
		layer.pyramid.requestTiles(plot, coords);
	});
};

module.exports = {
	requestTiles: requestTiles,
	requestBaseTile: requestBaseTile,
	panRequest: throttle(requestTiles, PAN_REQUEST_THROTTLE_MS),
	zoomRequest: throttle(requestTiles, ZOOM_REQUEST_THROTTLE_MS)
};
