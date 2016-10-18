'use strict';

const DOMRenderer = require('./DOMRenderer');

// Constants

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Class representing a SVG renderer.
 */
class SVGRenderer extends DOMRenderer {

	/**
	 * Instantiates a new SVGRenderer object.
	 */
	constructor() {
		super();
	}

	/**
	 * Create and return the DOM Element which contains the layer.
	 *
	 * @returns {Element} The layer container DOM element.
	 */
	createContainer() {
		const container = document.createElementNS(SVG_NS, 'svg');
		container.style.position = 'absolute';
		container.style.left = 0;
		container.style.bottom = -20;
		container.style.overflow = 'visible';
		container.setAttribute('width', 20);
		container.setAttribute('height', 20);
		return container;
	}

	/**
	 * Create and return the DOM Element which represents an individual
	 * tile.
	 *
	 * @param {Number} x - The x position of the tile, in pixels.
	 * @param {Number} y - The y position of the tile, in pixels.
	 * @param {Number} size - the size of the tile, in pixels.
	 *
	 * @returns {Element} The layer container DOM element.
	 */
	createTile(x, y, size) {
		const tile = document.createElementNS(SVG_NS, 'g');
		tile.setAttribute('transform', `translate(${x},${-y - size})`);
		return tile;
	}
}

module.exports = SVGRenderer;
