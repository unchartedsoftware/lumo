'use strict';

const Event = require('./Event');

class DrawEvent extends Event {
	constructor(timestamp, tiles) {
		super(timestamp);
		this.tiles = tiles;
	}
}

module.exports = DrawEvent;
