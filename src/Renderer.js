(function() {

    'use strict';

    const esper = require('esper');

    /**
     * Class representing a renderer.
     */
    class Renderer {

        /**
         * Instantiates a new Renderer object.
         */
        constructor() {
            this.gl = null;
            this.layer = null;
        }

        /**
         * Executed when the renderer is attached to a layer.
         *
         * @param {Layer} layer - The layer to attach the renderer to.
         *
         * @returns {Renderer} The renderer object, for chaining.
         */
        onAdd(layer) {
            if (!layer) {
                throw 'No layer provided as argument';
            }
            this.gl = esper.WebGLContext.get(layer.plot.canvas);
            this.layer = layer;
            return this;
        }

        /**
         * Executed when the renderer is removed from a layer.
         *
         * @param {Layer} layer - The layer to remove the renderer from.
         *
         * @returns {Renderer} The renderer object, for chaining.
         */
        onRemove(layer) {
            if (!layer) {
                throw 'No layer provided as argument';
            }
            this.gl = null;
            this.layer = null;
            return this;
        }

        /**
         * The draw function that is executed per frame.
         *
         * @param {Number} timestamp - The frame timestamp.
         *
         * @returns {Renderer} The renderer object, for chaining.
         */
        draw() {
            return this;
        }
    }

    module.exports = Renderer;

}());
