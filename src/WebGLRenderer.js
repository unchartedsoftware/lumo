(function() {

    'use strict';

    const esper = require('esper');
    const Renderer = require('./Renderer');

    /**
     * Class representing a webgl renderer.
     */
    class WebGLRenderer extends Renderer {

        /**
         * Instantiates a new WebGLRenderer object.
         */
        constructor() {
            super();
            this.gl = null;
        }

        /**
         * Executed when the renderer is attached to a layer.
         *
         * @param {Layer} layer - The layer to attach the renderer to.
         *
         * @returns {Renderer} The renderer object, for chaining.
         */
        onAdd(layer) {
            super.onAdd(layer);
            this.gl = esper.WebGLContext.get(this.layer.plot.canvas);
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
            this.gl = null;
            super.onRemove(layer);
            return this;
        }
    }

    module.exports = WebGLRenderer;

}());
