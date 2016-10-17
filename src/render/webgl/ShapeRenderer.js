(function() {

    'use strict';

    const defaultTo = require('lodash/defaultTo');
    const EventType = require('../../event/EventType');
    const Shader = require('./shader/Shader');
    const VertexAtlas = require('./vertex/VertexAtlas');
    const VertexBuffer = require('./vertex/VertexBuffer');
    const WebGLRenderer = require('./WebGLRenderer');

    const CIRCLE_SLICES = 64;
    const CIRCLE_RADIUS = 1;

    const shader = {
        vert:
            `
            precision highp float;
            attribute vec2 aPosition;
            attribute vec2 aOffset;
            attribute float aRadius;
            uniform vec2 uTileOffset;
            uniform float uTileScale;
            uniform mat4 uProjectionMatrix;
            void main() {
                vec2 wPosition = (aPosition * aRadius) + (aOffset * uTileScale) + uTileOffset;
                gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
            }
            `,
        frag:
            `
            precision highp float;
            uniform vec4 uColor;
            void main() {
                gl_FragColor = uColor;
            }
            `
    };

    const createCircle = function(gl) {
        const theta = (2 * Math.PI) / CIRCLE_SLICES;
        // precalculate sine and cosine
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        // start at angle = 0
        let x = CIRCLE_RADIUS;
        let y = 0;
        const positions = new Float32Array((CIRCLE_SLICES + 2) * 2);
        positions[0] = 0;
        positions[1] = 0;
        positions[positions.length-2] = CIRCLE_RADIUS;
        positions[positions.length-1] = 0;
        for (let i=0; i<CIRCLE_SLICES; i++) {
            positions[(i+1)*2] = x;
            positions[(i+1)*2+1] = y;
            // apply the rotation
            const t = x;
            x = c * x - s * y;
            y = s * t + c * y;
        }
        return new VertexBuffer(
            gl,
            positions,
            {
                0: {
                    size: 2,
                    type: 'FLOAT'
                }
            },
            {
                mode: 'TRIANGLE_FAN',
                count: positions.length / 2
            });
    };

    const renderTiles = function(gl, atlas, circle, shader, plot, renderables, color) {
        // get projection
        const proj = plot.viewport.getOrthoMatrix();

        // bind render target
        plot.renderBuffer.bind();

        // clear viewport
        gl.clear(gl.COLOR_BUFFER_BIT);

        // set blending func
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        // bind shader
        shader.use();

        // set projection
        shader.setUniform('uProjectionMatrix', proj);
        // set color
        shader.setUniform('uColor', color);

        // bind circle
        circle.bind();

        // binds the buffer to instance
        atlas.bindInstanced();

        // for each renderable
        renderables.forEach(renderable => {
            // set tile scale
            shader.setUniform('uTileScale', renderable.scale);
            // get tile offset
            shader.setUniform('uTileOffset', renderable.tileOffset);
            // draw the instances
            atlas.drawInstanced(renderable.hash, circle.mode, circle.count);
        });

        // unbind
        atlas.unbindInstanced();

        // unbind quad
        circle.unbind();

        // unbind render target
        plot.renderBuffer.unbind();
    };

    /**
     * Class representing a pointer renderer.
     */
    class PointRenderer extends WebGLRenderer {

        /**
         * Instantiates a new PointRenderer object.
         *
         * @param {Options} options - The options object.
         * @param {Array} options.color - The color of the points.
         */
        constructor(options = {}) {
            super();
            this.circle = null;
            this.shader = null;
            this.atlas = null;
            this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
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
            this.circle = createCircle(this.gl);
            this.shaders = new Shader(this.gl, shader);
            this.atlas = new VertexAtlas(
                this.gl,
                {
                    // offset
                    1: {
                        size: 2,
                        type: 'FLOAT'
                    },
                    // radius
                    2: {
                        size: 1,
                        type: 'FLOAT'
                    }
                }, {
                    // set num chunks to be able to fit the capacity of the pyramid
                    numChunks: layer.pyramid.totalCapacity
                });
            this.tileAdd = event => {
                const tile = event.tile;
                this.atlas.set(tile.coord.hash, tile.data, tile.data.length / 3);
            };
            this.tileRemove = event => {
                const tile = event.tile;
                this.atlas.delete(tile.coord.hash);
            };
            layer.on(EventType.TILE_ADD, this.tileAdd);
            layer.on(EventType.TILE_REMOVE, this.tileRemove);
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
            this.layer.removeListener(this.add);
            this.layer.removeListener(this.remove);
            this.tileAdd = null;
            this.tileRemove = null;
            this.circle = null;
            this.shader = null;
            this.atlas = null;
            super.onRemove(layer);
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
            // render the tiles
            renderTiles(
                this.gl,
                this.atlas,
                this.circle,
                this.shader,
                this.layer.plot,
                this.getRenderables(),
                this.color);
            // render framebuffer to the backbuffer
            this.layer.plot.renderBuffer.blitToScreen(this.layer.opacity);
            return this;
        }
    }

    module.exports = PointRenderer;

}());
