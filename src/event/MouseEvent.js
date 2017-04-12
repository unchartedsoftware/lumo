'use strict';

const Event = require('./Event');

/**
 * Class representing a mouse event.
 */
class MouseEvent extends Event {

	/**
	 * Instantiates a new MouseEvent object.
	 *
	 * @param {Object} target - The object that fired the event.
	 * @param {string} event - The original DOM mouse event fired by the browser.
	 * @param {Object} pos - The position of the mouse event in plot coordinates.
	 * @param {Object} px - The position of the mouse event in viewport pixel coordinates.
	 * @param {Object} data - The data associated with the event.
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
