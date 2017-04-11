'use strict';

const DOMRenderer = require('./DOMRenderer');

// Constants

/**
 * SVG Namespace string.
 * @private
 * @constant {String}
 */
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Arbitrary size of the root svg element, since it cannot be 0x0.
 * @private
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
	 * @param {Number} size - the size of the tile, in pixels.
	 *
	 * @returns {Element} The tile SVG element.
	 */
	createTile() {
		return document.createElementNS(SVG_NS, 'g');
	}

	/**
	 * Set the location of the SVG Element which represents an individual
	 * tile.
	 *
	 * @param {Element} tile - The tile DOM element.
	 * @param {Number} x - The x position of the tile, in pixels.
	 * @param {Number} y - The y position of the tile, in pixels.
	 * @param {Number} size - the size of the tile, in pixels.
	 *
	 * @returns {Element} The tile SVG element.
	 */
	positionTile(tile, x, y, size) {
		tile.setAttribute('transform', `translate(${x},${-y - size})`);
	}
}

module.exports = SVGRenderer;
