(function() {

    'use strict';

    const esper = require('esper');
    const Event = require('./Event');
    const WebGLRenderer = require('./WebGLRenderer');
    const VertexAtlas = require('./VertexAtlas');

    const CIRCLE_SLICES = 32;
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
            uniform float uOpacity;
            void main() {
                gl_FragColor = vec4(uColor.rgb, uColor.a * uOpacity);
            }
            `
    };

    const createCircleOutline = function() {
        const theta = (2 * Math.PI) / CIRCLE_SLICES;
        // precalculate sine and cosine
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        // start at angle = 0
        let x = CIRCLE_RADIUS;
        let y = 0;
        let t;
        const positions = new Float32Array(CIRCLE_SLICES * 2);
        for (let i=0; i<CIRCLE_SLICES; i++) {
            positions[i*2] = x;
            positions[i*2+1] = y;
            // apply the rotation
            t = x;
            x = c * x - s * y;
            y = s * t + c * y;
        }
        return new esper.VertexBuffer(
            positions,
            {
                0: {
                    size: 2,
                    type: 'FLOAT'
                }
            },
            {
                mode: 'LINE_LOOP',
                count: positions.length / 2
            });
    };

    const createCircleFill = function() {
        const theta = (2 * Math.PI) / CIRCLE_SLICES;
        // precalculate sine and cosine
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        // start at angle = 0
        let x = CIRCLE_RADIUS;
        let y = 0;
        let t;
        const positions = new Float32Array((CIRCLE_SLICES + 2) * 2);
        positions[0] = 0;
        positions[1] = 0;
        positions[positions.length-2] = CIRCLE_RADIUS;
        positions[positions.length-1] = 0;
        for (let i=0; i<CIRCLE_SLICES; i++) {
            positions[(i+1)*2] = x;
            positions[(i+1)*2+1] = y;
            // apply the rotation
            t = x;
            x = c * x - s * y;
            y = s * t + c * y;
        }
        return new esper.VertexBuffer(
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

    const getRenderables = function(plot, pyramid) {

        // get all currently visible tile coords
        const coords = plot.viewport.getVisibleCoords(
            plot.tileSize,
            plot.zoom,
            Math.round(plot.zoom), // get tiles closest to current zoom
            plot.wraparound);

        // get available renderables
        const renderables = [];
        coords.forEach(coord => {
            const ncoord = coord.normalize();
            // check if we have the tile
            if (pyramid.has(ncoord)) {
                const renderable = {
                    coord: coord,
                    scale: Math.pow(2, plot.zoom - coord.z),
                    hash: ncoord.hash
                };
                renderables.push(renderable);
            }
        });
        return renderables;
    };

    const renderTiles = function(gl, atlas, circle, shader, plot, pyramid, opacity, color) {
        // get projection
        const proj = plot.viewport.getOrthoMatrix();

        // bind shader
        shader.use();

        // set projection
        shader.setUniform('uProjectionMatrix', proj);
        // set color
        shader.setUniform('uColor', color);
        // set opacity
        shader.setUniform('uOpacity', opacity);

        // set blending func
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        // bind circle
        circle.bind();

        // binds the buffer to instance
        atlas.bind();

        // get view offset
        const viewOffset = [
            plot.viewport.x,
            plot.viewport.y
        ];

        // get renderables
        const renderables = getRenderables(plot, pyramid);

        // for each renderable
        renderables.forEach(renderable => {
            const coord = renderable.coord;
            // set tile scale
            shader.setUniform('uTileScale', renderable.scale);
            // get tile offset
            const tileOffset = [
                coord.x * renderable.scale * plot.tileSize,
                coord.y * renderable.scale * plot.tileSize
            ];
            const offset = [
                tileOffset[0] - viewOffset[0],
                tileOffset[1] - viewOffset[1]
            ];
            shader.setUniform('uTileOffset', offset);
            // draw the instances
            atlas.draw(renderable.hash, circle.mode, circle.count);
        });

        // unbind
        atlas.unbind();

        // unbind quad
        circle.unbind();

    };

    /**
     * Class representing a pointer renderer.
     */
    class PointRenderer extends WebGLRenderer {

        /**
         * Instantiates a new PointRenderer object.
         */
        constructor() {
            super();
            this.circleFill = null;
            this.circleOutline = null;
            this.shader = null;
            this.atlas = null;
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
            this.circleFill = createCircleFill();
            this.circleOutline = createCircleOutline();
            this.shader = new esper.Shader(shader);
            this.atlas = new VertexAtlas({
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
            this.tileAdd = tile => {
                this.atlas.set(tile.coord.hash, tile.data, tile.data.length / 3);
            };
            this.tileRemove = tile => {
                this.atlas.delete(tile.coord.hash);
            };
            layer.on(Event.TILE_ADD, this.tileAdd);
            layer.on(Event.TILE_REMOVE, this.tileRemove);
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
            this.circleFill = null;
            this.circleOutline = null;
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
            const gl = this.gl;

            // render the fill
            renderTiles(
                this.gl,
                this.atlas,
                this.circleFill,
                this.shader,
                this.layer.plot,
                this.layer.pyramid,
                this.layer.opacity,
                [ 1.0, 0.4, 0.1, 1.0]);

            // render the outlines
            gl.lineWidth(1);
            renderTiles(
                this.gl,
                this.atlas,
                this.circleOutline,
                this.shader,
                this.layer.plot,
                this.layer.pyramid,
                this.layer.opacity,
                [ 0.0, 0.0, 0.0, 1.0]);
            return this;
        }
    }

    module.exports = PointRenderer;

}());
