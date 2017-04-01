'use strict';

const Event = require('./Event');

class CellEvent extends Event {
	constructor(cell) {
		super();
		this.cell = cell;
	}
}

module.exports = CellEvent;
