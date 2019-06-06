'use strict';

const Event = require('./Event');

/**
 * Class representing a mouse event.
 */
class MouseEvent extends Event {

	/**
	 * Instantiates a new MouseEvent object.
	 *
	 * @param {object} target - The object that fired the event.
	 * @param {string} event - The original DOM mouse event fired by the browser.
	 * @param {object} pos - The position of the mouse event in plot coordinates.
	 * @param {object} px - The position of the mouse event in viewport pixel coordinates.
	 * @param {object} data - The data associated with the event.
	 */
	constructor(target, event, pos, px, data = null) {
		super(target);
		this.originalEvent = event;
		this.pos = pos;
		this.px = px;
		this.data = data;
	}
}

module.exports = MouseEvent;
