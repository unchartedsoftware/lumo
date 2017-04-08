'use strict';

const Event = require('./Event');

/**
 * Class representing a mouse event.
 */
class MouseEvent extends Event {

	/**
	 * Instantiates a new MouseEvent object.
	 *
	 * @param {Object} target - The mouse event target object.
	 * @param {string} button - The button string.
	 * @param {Object} pos - The plot position of the mouse event.
	 * @param {Object} data - The data associated with the target component.
	 */
	constructor(target, button, pos, data = null) {
		super();
		this.target = target;
		this.pos = pos;
		this.button = button;
		this.data = data;
	}
}

module.exports = MouseEvent;
