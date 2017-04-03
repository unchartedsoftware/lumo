'use strict';

const Event = require('./Event');

class MouseEvent extends Event {
	constructor(target, button, pos, data = null) {
		super();
		this.target = target;
		this.pos = pos;
		this.button = button;
		this.data = data;
	}
}

module.exports = MouseEvent;
