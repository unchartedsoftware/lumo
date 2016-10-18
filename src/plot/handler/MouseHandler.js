'use strict';

const EventType = require('../../event/EventType');
const MouseEvent = require('../../event/MouseEvent');

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
	return new MouseEvent(
		plot,
		getMouseButton(event),
		plot.mouseToViewPx(event),
		plot.mouseToPlotPx(event));
};

/**
 * Class representing a mouse handler.
 */
class MouseHandler {

	/**
	 * Instantiates a new MouseHandler object.
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
	 * @returns {MouseHandler} The handler object, for chaining.
	 */
	enable() {
		if (this.enabled) {
			throw 'Handler is already enabled';
		}

		const plot = this.plot;

		this.mousedown = (event) => {
			this.plot.emit(EventType.MOUSE_DOWN, createEvent(plot, event));
		};

		this.mouseup = (event) => {
			this.plot.emit(EventType.MOUSE_UP, createEvent(plot, event));
		};

		this.mousemove = (event) => {
			this.plot.emit(EventType.MOUSE_MOVE, createEvent(plot, event));
		};

		this.mouseover = (event) => {
			this.plot.emit(EventType.MOUSE_OVER, createEvent(plot, event));
		};

		this.mouseout = (event) => {
			this.plot.emit(EventType.MOUSE_OUT, createEvent(plot, event));
		};

		plot.container.addEventListener('mousedown', this.mousedown);
		plot.container.addEventListener('mouseup', this.mouseup);
		plot.container.addEventListener('mousemove', this.mousemove);
		plot.container.addEventListener('mouseover', this.mouseover);
		plot.container.addEventListener('mouseout', this.mouseout);
		this.enabled = true;
	}

	/**
	 * Disables the handler.
	 *
	 * @returns {MouseHandler} The handler object, for chaining.
	 */
	disable() {
		if (this.enabled) {
			throw 'Handler is already disabled';
		}
		this.plot.container.removeEventListener('mousedown', this.mousedown);
		this.plot.container.removeEventListener('mouseup', this.mouseup);
		this.plot.container.removeEventListener('mousemove', this.mousemove);
		this.plot.container.removeEventListener('mouseover', this.mouseover);
		this.plot.container.removeEventListener('mouseout', this.mouseout);
		this.mousedown = null;
		this.mouseup = null;
		this.mousemove = null;
		this.mouseover = null;
		this.mouseout = null;
		this.enabled = false;
	}
}

module.exports = MouseHandler;
