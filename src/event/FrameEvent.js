'use strict';

const Event = require('./Event');

/**
 * Class representing a frame event.
 */
class FrameEvent extends Event {

	/**
	 * Instantiates a new FrameEvent object.
	 *
	 * @param {Number} timestamp - The timestamp when the event was created.
	 */
	constructor(timestamp) {
		super(timestamp);
	}
}

module.exports = FrameEvent;
