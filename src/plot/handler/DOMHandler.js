'use strict';

/**
 * Class representing a DOM handler.
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
		this.enable = true;
	}

	/**
	 * Disables the handler.
	 *
	 * @returns {ZoomHandler} The handler object, for chaining.
	 */
	disable() {
		if (this.enabled) {
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
		const plot = this.plot;
		const extent = plot.getPixelExtent();
		const size = plot.getViewportPixelSize();
		return {
			x: plot.viewport.x + (event.clientX / extent),
			y: plot.viewport.y + ((size.height - event.clientY) / extent)
		};
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
		const size = this.plot.getViewportPixelSize();
		return {
			x: event.clientX,
			y: size.height - event.clientY
		};
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
		const extent = this.plot.getPixelExtent();
		return {
			x: px.x / extent,
			y: px.y / extent
		};
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
		const extent = this.plot.getPixelExtent();
		return {
			x: pos.x * extent,
			y: pos.y * extent
		};
	}

	/**
	 * Takes a DOM event and returns the mouse button string.
	 *
	 * @param {Event} event - The mouse event.
	 *
	 * @returns {String} The mouse button string.
	 */
	getMouseButton(event) {
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
}

module.exports = DOMHandler;
