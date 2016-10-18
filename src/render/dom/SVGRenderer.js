'use strict';

const DOMRenderer = require('./DOMRenderer');

// Constants

/**
 * SVG Namespace string.
 * @constant {String}
 */
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Arbitrary size of the root svg element.
 * @constant {Number}
 */
const SVG_SIZE = 20;

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
	 * Create and return the SVG Element which contains the layer.
	 *
	 * @returns {Element} The layer container SVG element.
	 */
	createContainer() {
		const container = document.createElementNS(SVG_NS, 'svg');
		container.style.position = 'absolute';
		container.style.overflow = 'visible';
		container.style.left = 0;
		container.style.bottom = -SVG_SIZE;
		container.setAttribute('width', SVG_SIZE);
		container.setAttribute('height', SVG_SIZE);
		return container;
	}

	/**
	 * Create and return the SVG Element which represents an individual
	 * tile.
	 *
	 * @param {Number} x - The x position of the tile, in pixels.
	 * @param {Number} y - The y position of the tile, in pixels.
	 * @param {Number} size - the size of the tile, in pixels.
	 *
	 * @returns {Element} The layer container SVG element.
	 */
	createTile(x, y, size) {
		const tile = document.createElementNS(SVG_NS, 'g');
		tile.setAttribute('transform', `translate(${x},${-y - size})`);
		return tile;
	}
}

module.exports = SVGRenderer;
