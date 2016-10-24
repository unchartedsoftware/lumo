'use strict';

const EventType = require('../../event/EventType');
const ClickEvent = require('../../event/ClickEvent');

// Const

/**
 * Distance in pixels the mouse can be moved before the click event is
 * cancelled.
 * @private
 * @constant {Number}
 */
const MOVE_TOLERANCE = 15;

// Private Methods

const getMouseButton = function(event) {
	if (event.which) {
		if (event.which === 1) {
			return 'left';
		} else if (event.which === 2) {
			return 'middle';
		} else if (event.which === 3) {
			return 'right';
		}
	}
	if (event.button === 0) {
		return 'left';
	} else if (event.button === 1) {
		return 'middle';
	} else if (event.button === 2) {
		return 'right';
	}
};

const createEvent = function(plot, event) {
	return new ClickEvent(
		plot,
		getMouseButton(event),
		plot.mouseToViewPx(event),
		plot.mouseToPlotPx(event));
};

/**
 * Class representing a click handler.
 */
class ClickHandler {

	/**
	 * Instantiates a new ClickHandler object.
	 *
	 * @param {Plot} plot - The plot to attach the handler to.
	 */
	constructor(plot) {
		this.plot = plot;
		this.enabled = false;
	}

	/**
	 * Enables the handler.
	 *
	 * @returns {ClickHandler} The handler object, for chaining.
	 */
	enable() {
		if (this.enabled) {
			throw 'Handler is already enabled';
		}

		const plot = this.plot;

		let last = null;
		this.mousedown = (event) => {
			last = plot.mouseToViewPx(event);
		};

		this.mouseup = (event) => {
			if (!last) {
				return;
			}
			const pos = plot.mouseToViewPx(event);
			const diff = {
				x: last.x - pos.x ,
				y: last.y - pos.y
			};
			const distSqrd = diff.x * diff.x + diff.y * diff.y;
			if (distSqrd < MOVE_TOLERANCE * MOVE_TOLERANCE) {
				// movement was within tolerance, emit click
				this.plot.emit(EventType.CLICK, createEvent(plot, event));
			}
			last = null;
		};

		this.dblclick = (event) => {
			this.plot.emit(EventType.DBL_CLICK, createEvent(plot, event));
		};

		plot.container.addEventListener('mousedown', this.mousedown);
		plot.container.addEventListener('mouseup', this.mouseup);
		plot.container.addEventListener('dblclick', this.dblclick);
		this.enabled = true;
	}

	/**
	 * Disables the handler.
	 *
	 * @returns {ClickHandler} The handler object, for chaining.
	 */
	disable() {
		if (this.enabled) {
			throw 'Handler is already disabled';
		}
		this.plot.container.removeEventListener('mousedown', this.mousedown);
		this.plot.container.removeEventListener('mouseup', this.mouseup);
		this.plot.container.removeEventListener('dblclick', this.dblclick);
		this.mousedown = null;
		this.mouseup = null;
		this.dblclick = null;
		this.enabled = false;
	}
}

module.exports = ClickHandler;
