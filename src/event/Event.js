'use strict';

/**
 * Class representing an event.
 */
class Event {

	/**
	 * Instantiates a new Event object.
	 *
	 * @param {Object} target - The object that fired the event.
	 * @param {number} timestamp - The timestamp when the event was created. Optional.
	 */
	constructor(target, timestamp = Date.now()) {
		this.target = target;
		this.timestamp = timestamp;
	}
}

module.exports = Event;
