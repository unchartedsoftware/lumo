'use strict';

const EventType = require('../../event/EventType');
const MouseEvent = require('../../event/MouseEvent');
const DOMHandler = require('./DOMHandler');

// Private Methods

const createEvent = function(handler, plot, event) {
	return new MouseEvent(
		plot,
		handler.getMouseButton(event),
		handler.mouseToPlot(event));
};

/**
 * Class representing a mouse handler.
 */
class MouseHandler extends DOMHandler {

	/**
	 * Instantiates a new MouseHandler object.
	 *
	 * @param {Plot} plot - The plot to attach the handler to.
	 */
	constructor(plot) {
		super(plot);
	}

	/**
	 * Enables the handler.
	 *
	 * @returns {MouseHandler} The handler object, for chaining.
	 */
	enable() {
		super.enable();

		const plot = this.plot;

		this.mousedown = (event) => {
			this.plot.emit(EventType.MOUSE_DOWN, createEvent(this, plot, event));
		};

		this.mouseup = (event) => {
			this.plot.emit(EventType.MOUSE_UP, createEvent(this, plot, event));
		};

		this.mousemove = (event) => {
			this.plot.emit(EventType.MOUSE_MOVE, createEvent(this, plot, event));
		};

		this.mouseover = (event) => {
			this.plot.emit(EventType.MOUSE_OVER, createEvent(this, plot, event));
		};

		this.mouseout = (event) => {
			this.plot.emit(EventType.MOUSE_OUT, createEvent(this, plot, event));
		};

		plot.container.addEventListener('mousedown', this.mousedown);
		plot.container.addEventListener('mouseup', this.mouseup);
		plot.container.addEventListener('mousemove', this.mousemove);
		plot.container.addEventListener('mouseover', this.mouseover);
		plot.container.addEventListener('mouseout', this.mouseout);
	}

	/**
	 * Disables the handler.
	 *
	 * @returns {MouseHandler} The handler object, for chaining.
	 */
	disable() {
		super.disable();

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
	}
}

module.exports = MouseHandler;
