'use strict';

module.exports = {

	/**
	 * Emitted when the plot is clicked.
	 * @constant {String}
	 */
	CLICK: 'click',

	/**
	 * Emitted when the plot is double clicked.
	 * @constant {String}
	 */
	DBL_CLICK: 'dblclick',

	/**
	 * Emitted when a mouse button is pressed.
	 * @constant {String}
	 */
	MOUSE_DOWN: 'mousedown',

	/**
	 * Emitted when a mouse button is released.
	 * @constant {String}
	 */
	MOUSE_UP: 'mouseup',

	/**
	 * Emitted when the mouse is moved on the target.
	 * @constant {String}
	 */
	MOUSE_MOVE: 'mousemove',

	/**
	 * Emitted when the mouse is moved onto the target.
	 * @constant {String}
	 */
	MOUSE_OVER: 'mouseover',

	/**
	 * Emitted when the mouse is moved out of the target.
	 * @constant {String}
	 */
	MOUSE_OUT: 'mouseout',

	/**
	 * Emitted when a new pan event is handled.
	 * @constant {String}
	 */
	PAN_START: 'panstart',

	/**
	 * Emitted during each frame of a pan animation.
	 * @constant {String}
	 */
	PAN: 'pan',

	/**
	 * Emitted on the final frame of a pan animation.
	 * @constant {String}
	 */
	PAN_END: 'panend',

	/**
	 * Emitted when a new zoom event is handled.
	 * @constant {String}
	 */
	ZOOM_START: 'zoomstart',

	/**
	 * Emitted during each frame of a zoom animation.
	 * @constant {String}
	 */
	ZOOM: 'zoom',

	/**
	 * Emitted on the final frame of a zoom animation.
	 * @constant {String}
	 */
	ZOOM_END: 'zoomend',

	/**
	 * Emitted before processing a new frame.
	 * @constant {String}
	 */
	FRAME: 'frame',

	/**
	 * Emitted when processing a resize event.
	 * @constant {String}
	 */
	RESIZE: 'resize',

	/**
	 * Emitted when an initial request for a tile is made, the tile is not
	 * yet part of the layer and has not yet been requested.
	 * @constant {String}
	 */
	TILE_REQUEST: 'tilerequest',

	/**
	 * Emitted when a tile request completes unsuccessfully. The tile is not
	 * added to the layer.
	 * @constant {String}
	 */
	TILE_FAILURE: 'tilefailure',

	/**
	 * Emitted when a tile request completes successfully. The tile is added
	 * to the layer.
	 * @constant {String}
	 */
	TILE_ADD: 'tileadd',

	/**
	 * Emitted when a tile request completes successfully but the tile is no
	 * longer in view. The tile is not added to the layer.
	 * @constant {String}
	 */
	TILE_DISCARD: 'tilediscard',

	/**
	 * Emitted when a tile is evicted from the internal LRU cache.
	 * @constant {String}
	 */
	TILE_REMOVE: 'tileremove',

	/**
	 * Emitted when all visible tiles have been loaded for a layer.
	 * @constant {String}
	 */
	LOAD: 'load',

	/**
	 * Emitted by DOMRenderer after tiles are rendered to the DOM.
	 * @constant {String}
	 */
	POST_DRAW: 'postdraw'
};
