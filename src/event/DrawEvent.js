'use strict';

const Event = require('./Event');

/**
 * Class representing a draw event.
 */
class DrawEvent extends Event {
	constructor(timestamp, tiles) {
		super(timestamp);
		this.tiles = tiles;
	}
}

module.exports = DrawEvent;
