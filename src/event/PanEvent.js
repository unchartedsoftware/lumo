'use strict';

const Event = require('./Event');
/**
 * Class representing a pan event.
 */
class PanEvent extends Event {

	/**
	 * Instantiates a new PanEvent object.
	 *
	 * @param {Number} plot - The plot object.
	 * @param {Number} prevPos - The previous position before the pan.
	 * @param {Number} targetSize - The current position of the pan.
	 */
	constructor(plot, prevPos = plot.viewport.getPosition(), currentPos = plot.viewport.getPosition()) {
		super();
		this.plot = plot;
		this.prevPos = prevPos;
		this.currentPos = currentPos;
	}
}

module.exports = PanEvent;
