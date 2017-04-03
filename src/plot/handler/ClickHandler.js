'use strict';

const EventType = require('../../event/EventType');
const ClickEvent = require('../../event/ClickEvent');
const DOMHandler = require('./DOMHandler');

// Const

/**
 * Distance in pixels the mouse can be moved before the click event is
 * cancelled.
 * @private
 * @constant {Number}
 */
const MOVE_TOLERANCE = 15;

// Private Methods

const createEvent = function(handler, plot, event) {
	return new ClickEvent(
		plot,
		handler.getMouseButton(event),
		handler.mouseToPlot(event));
};

/**
 * Class representing a click handler.
 */
class ClickHandler extends DOMHandler {

	/**
	 * Instantiates a new ClickHandler object.
	 *
	 * @param {Plot} plot - The plot to attach the handler to.
	 */
	constructor(plot) {
		super(plot);
	}

	/**
	 * Enables the handler.
	 *
	 * @returns {ClickHandler} The handler object, for chaining.
	 */
	enable() {
		super.enable();

		const plot = this.plot;

		let last = null;
		this.mousedown = (event) => {
			last = this.mouseToViewPx(event);
		};

		this.mouseup = (event) => {
			if (!last) {
				return;
			}
			const pos = this.mouseToViewPx(event);
			const diff = {
				x: last.x - pos.x ,
				y: last.y - pos.y
			};
			const distSqrd = diff.x * diff.x + diff.y * diff.y;
			if (distSqrd < MOVE_TOLERANCE * MOVE_TOLERANCE) {
				// movement was within tolerance, emit click
				this.plot.emit(EventType.CLICK, createEvent(this, plot, event));
			}
			last = null;
		};

		this.dblclick = (event) => {
			this.plot.emit(EventType.DBL_CLICK, createEvent(this, plot, event));
		};

		plot.container.addEventListener('mousedown', this.mousedown);
		plot.container.addEventListener('mouseup', this.mouseup);
		plot.container.addEventListener('dblclick', this.dblclick);
	}

	/**
	 * Disables the handler.
	 *
	 * @returns {ClickHandler} The handler object, for chaining.
	 */
	disable() {
		super.disable();
		this.plot.container.removeEventListener('mousedown', this.mousedown);
		this.plot.container.removeEventListener('mouseup', this.mouseup);
		this.plot.container.removeEventListener('dblclick', this.dblclick);
		this.mousedown = null;
		this.mouseup = null;
		this.dblclick = null;
	}
}

module.exports = ClickHandler;
