(function() {

    'use strict';

    const esper = require('esper');
    const Renderer = require('./Renderer');
    const VertexAtlas = require('./VertexAtlas');

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

    const getRenderable = function(atlas, coord, zoom, tile, offset) {
        const ncoord = tile.coord.normalize();
        if (!atlas.has(ncoord.hash)) {
            // data is not in texture yet, buffer it
            const count = tile.data.length / 3;
            atlas.set(ncoord.hash, tile.data, count);
        }
        // const chunk = atlas.get(ncoord.hash);
        const scale = Math.pow(2, zoom - coord.z);
        return {
            coord: coord,
            scale: scale,
            hash: ncoord.hash,
            offset: (offset.extent !== 1) ? null : offset
        };
    };

    const getRenderables = function(plot, pyramid, atlas) {

        // get all currently visible tile coords
        const coords = plot.viewport.getVisibleCoords(
            plot.tileSize,
            plot.zoom,
            Math.round(plot.zoom), // get tiles closest to current zoom
            plot.wraparound);

        const renderables = [];
        coords.forEach(coord => {
            // check if we have any tile LOD available
            const lod = pyramid.getAvailableLOD(coord);
            if (lod) {
                const renderable = getRenderable(
                    atlas,
                    coord,
                    plot.zoom,
                    lod.tile,
                    lod.offset);
                renderables.push(renderable);
            }
        });

        return renderables;
    };

    const renderTiles = function(gl, atlas, circle, shader, plot, pyramid, color) {
        // get projection
        const proj = plot.viewport.getOrthoMatrix();

        // bind shader
        shader.use();

        // set uniforms
        shader.setUniform('uProjectionMatrix', proj);
        shader.setUniform('uColor', color);

        // bind circle
        circle.bind();

        // get view offset
        const viewOffset = [
            plot.viewport.x,
            plot.viewport.y
        ];

        // binds the buffer to instance
        atlas.bind();

        // get renderables
        const renderables = getRenderables(plot, pyramid, atlas);

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

            // if (renderable.offset) {
            //     // enable scissor test
            //     gl.enable(gl.SCISSOR_TEST);
            //     // set the scissor rectangle
            //     gl.scissor(
            //         offset[0],
            //         offset[1],
            //         renderable.scale * plot.tileSize,
            //         renderable.scale * plot.tileSize);
            // } else {
            //     gl.disable(gl.SCISSOR_TEST);
            // }

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
    class PointRenderer extends Renderer {

        /**
         * Instantiates a new Renderer object.
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
            });
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
            super.onRemove(layer);
            this.circleFill = null;
            this.circleOutline = null;
            this.shader = null;
            this.atlas = null;
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
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            renderTiles(
                this.gl,
                this.atlas,
                this.circleFill,
                this.shader,
                this.layer.plot,
                this.layer.pyramid,
                [ 1.0, 0.4, 0.1, 1.0]);

            // render the outlines
            gl.lineWidth(1);
            //gl.disable(gl.BLEND);
            renderTiles(
                this.gl,
                this.atlas,
                this.circleOutline,
                this.shader,
                this.layer.plot,
                this.layer.pyramid,
                [ 0.0, 0.0, 0.0, 1.0]);
            return this;
        }
    }

    module.exports = PointRenderer;

}());
