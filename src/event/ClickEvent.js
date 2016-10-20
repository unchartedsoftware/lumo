'use strict';

const Event = require('./Event');

class ClickEvent extends Event {
	constructor(target, button, viewPx, plotPx, data = null) {
		super();
		this.target = target;
		this.viewPx = viewPx;
		this.plotPx = plotPx;
		this.button = button;
		this.data = data;
	}
}

module.exports = ClickEvent;
