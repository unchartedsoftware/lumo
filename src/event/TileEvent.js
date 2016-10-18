'use strict';

const Event = require('./Event');

class TileEvent extends Event {
	constructor(layer, tile) {
		super();
		this.layer = layer;
		this.tile = tile;
	}
}

module.exports = TileEvent;
