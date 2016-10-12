(function() {

    'use strict';

    const DOMRenderer = require('./DOMRenderer');

    /**
     * Class representing a HTML renderer.
     */
    class HTMLRenderer extends DOMRenderer {

        /**
         * Instantiates a new HTMLRenderer object.
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
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = 0;
            container.style.bottom = 0;
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
            const tile = document.createElement('div');
            tile.style.position = 'absolute';
            tile.style.width = `${size}px`;
            tile.style.height = `${size}px`;
            tile.style.left = `${x}px`;
            tile.style.bottom = `${y}px`;
            return tile;
        }
    }

    module.exports = HTMLRenderer;

}());
