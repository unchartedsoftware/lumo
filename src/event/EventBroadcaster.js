'use strict';

/**
 * Class representing an event broadcaster.
 */
class EventBroadcaster {

	/**
	 * Instantiates a new EventBroadcaster object.
	 *
	 * @param {Plot} plot - The plot to attach the broadcaster to.
	 */
	constructor(plot) {
		this.plot = plot;
	}

	/**
	 * Broadcasts the provided event type to all children of the plot.
	 *
	 * @param {String} type - The event type to broadcast.
	 */
	broadcast(type) {
		this.plot.on(type, event => {
			const children = this.plot.getSortedLayers();
			for (let i=children.length-1; i>=0; i--) {
				if (!children[i].isHidden()) {
					children[i].emit(type, event);
				}
			}
		});
	}
}

module.exports = EventBroadcaster;
