'use strict';

/**
 * Class representing an event.
 */
class Event {

	/**
	 * Instantiates a new Event object.
	 *
	 * @param {Number} timestamp - The timestamp when the event was created.
	 */
	constructor(timestamp = Date.now()) {
		this.timestamp = timestamp;
	}
}

module.exports = Event;
