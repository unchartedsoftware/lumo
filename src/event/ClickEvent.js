'use strict';

const Event = require('./Event');

/**
 * Class representing a click event.
 */
class ClickEvent extends Event {

	/**
	 * Instantiates a new ClickEvent object.
	 *
	 * @param {Object} target - The click event target object.
	 * @param {string} button - The button string.
	 * @param {Object} pos - The plot position of the click event.
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

module.exports = ClickEvent;
