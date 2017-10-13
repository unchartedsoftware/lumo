'use strict';

/**
 * Class representing a DOM handler.
 * @private
 */
class DOMHandler {

	/**
	 * Instantiates a new DOM object.
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
	 * @returns {ZoomHandler} The handler object, for chaining.
	 */
	enable() {
		if (this.enabled) {
			throw 'Handler is already enabled';
		}
		this.enabled = true;
	}

	/**
	 * Disables the handler.
	 *
	 * @returns {ZoomHandler} The handler object, for chaining.
	 */
	disable() {
		if (!this.enabled) {
			throw 'Handler is already disabled';
		}
		this.enabled = false;
	}

	/**
	 * Takes a DOM event and returns the corresponding plot position.
	 * Coordinate [0, 0] is bottom-left of the plot.
	 *
	 * @param {Event} event - The mouse event.
	 *
	 * @returns {Object} The plot position.
	 */
	mouseToPlot(event) {
		return this.plot.mouseToPlotCoord(event);
	}

	/**
	 * Takes a DOM event and returns the corresponding viewport pixel position.
	 * Coordinate [0, 0] is bottom-left of the viewport.
	 *
	 * @param {Event} event - The mouse event.
	 *
	 * @returns {Object} The viewport pixel coordinate.
	 */
	mouseToViewPx(event) {
		return this.plot.mouseToViewportPixel(event);
	}

	/**
	 * Takes a viewport pixel coordinate and returns the corresponding plot
	 * position.
	 * Coordinate [0, 0] is bottom-left of the plot.
	 *
	 * @param {Object} px - The viewport pixel coordinate.
	 *
	 * @returns {Object} The plot position.
	 */
	viewPxToPlot(px) {
		return this.plot.viewportPixelToPlotCoord(px);
	}

	/**
	 * Takes a plot position and returns the corresponding viewport pixel
	 * coordinate.
	 * Coordinate [0, 0] is bottom-left of the plot.
	 *
	 * @param {Object} pos - The plot position.
	 *
	 * @returns {Object} The viewport pixel coordinate.
	 */
	plotToViewPx(pos) {
		return this.plot.plotCoordToViewportPixel(pos);
	}

	/**
	 * Takes a DOM event and returns true if the left mouse button is down.
	 *
	 * @param {Event} event - The mouse event.
	 *
	 * @returns {boolean} Whether the left mouse button is down.
	 */
	isLeftButton(event) {
		return (event.which) ? event.which === 1 : event.button === 0;
	}

	/**
	 * Takes a DOM event and returns true if the middle mouse button is down.
	 *
	 * @param {Event} event - The mouse event.
	 *
	 * @returns {boolean} Whether the middle mouse button is down.
	 */
	isMiddleButton(event) {
		return (event.which) ? event.which === 2 : event.button === 1;
	}

	/**
	 * Takes a DOM event and returns true if the right mouse button is down.
	 *
	 * @param {Event} event - The mouse event.
	 *
	 * @returns {boolean} Whether the right mouse button is down.
	 */
	isRightButton(event) {
		return (event.which) ? event.which === 3 : event.button === 2;
	}
}

module.exports = DOMHandler;
