'use strict';

/**
 * Event type string constants.
 */
module.exports = {

	/**
	 * Emitted when the plot is clicked.
	 * @constant {string}
	 */
	CLICK: 'click',

	/**
	 * Emitted when the plot is double clicked.
	 * @constant {string}
	 */
	DBL_CLICK: 'dblclick',

	/**
	 * Emitted when a mouse button is pressed.
	 * @constant {string}
	 */
	MOUSE_DOWN: 'mousedown',

	/**
	 * Emitted when a mouse button is released.
	 * @constant {string}
	 */
	MOUSE_UP: 'mouseup',

	/**
	 * Emitted when the mouse is moved on the target.
	 * @constant {string}
	 */
	MOUSE_MOVE: 'mousemove',

	/**
	 * Emitted when the mouse is moved onto the target.
	 * @constant {string}
	 */
	MOUSE_OVER: 'mouseover',

	/**
	 * Emitted when the mouse is moved out of the target.
	 * @constant {string}
	 */
	MOUSE_OUT: 'mouseout',

	/**
	 * Emitted when a new pan event is handled.
	 * @constant {string}
	 */
	PAN_START: 'panstart',

	/**
	 * Emitted during each frame of a pan animation.
	 * @constant {string}
	 */
	PAN: 'pan',

	/**
	 * Emitted on the final frame of a pan animation.
	 * @constant {string}
	 */
	PAN_END: 'panend',

	/**
	 * Emitted when a new zoom event is handled.
	 * @constant {string}
	 */
	ZOOM_START: 'zoomstart',

	/**
	 * Emitted during each frame of a zoom animation.
	 * @constant {string}
	 */
	ZOOM: 'zoom',

	/**
	 * Emitted on the final frame of a zoom animation.
	 * @constant {string}
	 */
	ZOOM_END: 'zoomend',

	/**
	 * Emitted before processing a new frame.
	 * @constant {string}
	 */
	FRAME: 'frame',

	/**
	 * Emitted when processing a resize event.
	 * @constant {string}
	 */
	RESIZE: 'resize',

	/**
	 * Emitted when the viewing cell of the plot is updated.
	 * @constant {string}
	 */
	CELL_UPDATE: 'cellupdate',

	/**
	 * Emitted when the layer is refreshed.
	 * @constant {string}
	 */
	REFRESH: 'refresh',

	/**
	 * Emitted when an initial request for a tile is made, the tile is not
	 * yet part of the layer and has not yet been requested.
	 * @constant {string}
	 */
	TILE_REQUEST: 'tilerequest',

	/**
	 * Emitted when a tile request completes unsuccessfully. The tile is not
	 * added to the layer.
	 * @constant {string}
	 */
	TILE_FAILURE: 'tilefailure',

	/**
	 * Emitted when a tile request completes successfully. The tile is added
	 * to the layer.
	 * @constant {string}
	 */
	TILE_ADD: 'tileadd',

	/**
	 * Emitted when a tile request completes successfully but the tile is no
	 * longer in view. The tile is not added to the layer.
	 * @constant {string}
	 */
	TILE_DISCARD: 'tilediscard',

	/**
	 * Emitted when a tile is evicted from the internal LRU cache.
	 * @constant {string}
	 */
	TILE_REMOVE: 'tileremove',

	/**
	 * Emitted when all visible tiles have been loaded for a layer.
	 * @constant {string}
	 */
	LOAD: 'load'
};
