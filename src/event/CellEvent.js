'use strict';

const Event = require('./Event');

/**
 * Class representing a cell event.
 */
class CellEvent extends Event {

	/**
	 * Instantiates a new CellEvent object.
	 *
	 * @param {Cell} cell - The cell object.
	 */
	constructor(cell) {
		super();
		this.cell = cell;
	}
}

module.exports = CellEvent;
