'use strict';

const Event = require('./Event');

class LayerEvent extends Event {
	constructor(layer) {
		super();
		this.layer = layer;
	}
}

module.exports = LayerEvent;
