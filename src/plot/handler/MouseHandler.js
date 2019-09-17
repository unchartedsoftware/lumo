'use strict';

const EventType = require('../../event/EventType');
const MouseEvent = require('../../event/MouseEvent');
const DOMHandler = require('./DOMHandler');

// Private Methods

const createEvent = function(handler, plot, event) {
	return new MouseEvent(
		plot, // target
		event, // originalEvent
		handler.mouseToPlot(event), // pos
		handler.mouseToViewPx(event)); // px
};

/**
 * Class representing a mouse handler.
 *
 * @private
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
		if (this.enabled) {
			return this;
		}

		const plot = this.plot;

		this.mousedown = (event) => {
			plot.setDirty();
			event.preventDefault();
			plot.emit(EventType.MOUSE_DOWN, createEvent(this, plot, event));
		};

		this.mouseup = (event) => {
			plot.setDirty();
			event.preventDefault();
			plot.emit(EventType.MOUSE_UP, createEvent(this, plot, event));
		};

		this.mousemove = (event) => {
			plot.setDirty();
			event.preventDefault();
			plot.emit(EventType.MOUSE_MOVE, createEvent(this, plot, event));
		};

		this.mouseover = (event) => {
			plot.setDirty();
			event.preventDefault();
			plot.emit(EventType.MOUSE_OVER, createEvent(this, plot, event));
		};

		this.mouseout = (event) => {
			plot.setDirty();
			event.preventDefault();
			plot.emit(EventType.MOUSE_OUT, createEvent(this, plot, event));
		};

		this.wheel = (event) => {
			plot.setDirty();
			event.preventDefault();
		};

		const container = plot.getContainer();
		container.addEventListener('mousedown', this.mousedown);
		container.addEventListener('mouseup', this.mouseup);
		container.addEventListener('mousemove', this.mousemove);
		container.addEventListener('mouseover', this.mouseover);
		container.addEventListener('mouseout', this.mouseout);
		container.addEventListener('wheel', this.wheel);
		return super.enable();
	}

	/**
	 * Disables the handler.
	 *
	 * @returns {MouseHandler} The handler object, for chaining.
	 */
	disable() {
		if (!this.enabled) {
			return this;
		}

		const container = this.plot.getContainer();
		container.removeEventListener('mousedown', this.mousedown);
		container.removeEventListener('mouseup', this.mouseup);
		container.removeEventListener('mousemove', this.mousemove);
		container.removeEventListener('mouseover', this.mouseover);
		container.removeEventListener('mouseout', this.mouseout);
		container.removeEventListener('wheel', this.wheel);
		this.mousedown = null;
		this.mouseup = null;
		this.mousemove = null;
		this.mouseover = null;
		this.mouseout = null;
		this.wheel = null;
		return super.disable();
	}
}

module.exports = MouseHandler;
