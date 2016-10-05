(function() {

    'use strict';

    const esper = require('esper');
    const TextureAtlas = require('./TextureAtlas');

    const shader = {
        vert:
            `
            precision highp float;
            attribute vec2 aPosition;
            attribute vec2 aTextureCoord;
            uniform vec4 uTextureCoordOffset;
            uniform vec2 uOffset;
            uniform float uScale;
            uniform mat4 uProjectionMatrix;
            varying vec2 vTextureCoord;
            void main() {
                vTextureCoord = vec2(
                    uTextureCoordOffset.x + (aTextureCoord.x * uTextureCoordOffset.z),
                    uTextureCoordOffset.y + (aTextureCoord.y * uTextureCoordOffset.w));
                vec2 wPosition = (aPosition * uScale) + uOffset;
                gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
            }
            `,
        frag:
            `
            precision highp float;
            uniform sampler2D uTextureSampler;
            varying vec2 vTextureCoord;
            void main() {
                gl_FragColor = texture2D(uTextureSampler, vTextureCoord);
            }
            `
    };

    const createQuad = function(min, max) {
        const BYTES_PER_FLOAT = 4;
        const NUM_VERTICES = 6;
        const COMPONENTS_PER_VERTEX = 2;
        const BYTE_LENGTH = COMPONENTS_PER_VERTEX * NUM_VERTICES * BYTES_PER_FLOAT;
        const vertices = new Float32Array(24);
        // positions
        vertices[0] = min;      vertices[1] = min;
        vertices[2] = max;      vertices[3] = min;
        vertices[4] = max;      vertices[5] = max;
        vertices[6] = min;      vertices[7] = min;
        vertices[8] = max;      vertices[9] = max;
        vertices[10] = min;     vertices[11] = max;
        // uvs
        vertices[12] = 0;       vertices[13] = 0;
        vertices[14] = 1;       vertices[15] = 0;
        vertices[16] = 1;       vertices[17] = 1;
        vertices[18] = 0;       vertices[19] = 0;
        vertices[20] = 1;       vertices[21] = 1;
        vertices[22] = 0;       vertices[23] = 1;
        // create quad buffer
        return new esper.VertexBuffer(
            vertices,
            {
                0: {
                    size: COMPONENTS_PER_VERTEX,
                    type: 'FLOAT',
                    byteOffset: 0
                },
                1: {
                    size: COMPONENTS_PER_VERTEX,
                    type: 'FLOAT',
                    byteOffset: BYTE_LENGTH
                }
            },
            {
                count: NUM_VERTICES,
            });
    };

    const getRenderable = function(atlas, coord, tile, offset) {
        const ncoord = tile.coord.normalize();
        if (!atlas.has(ncoord.hash)) {
            // data is not in texture yet, buffer it
            atlas.set(ncoord.hash, tile.data);
        }
        const chunk = atlas.get(ncoord.hash);
        return {
            coord: coord,
            offset: [
                chunk.xOffset + (chunk.xExtent * offset.x),
                chunk.yOffset + (chunk.yExtent * offset.y),
                chunk.xExtent * offset.extent,
                chunk.yExtent * offset.extent
            ]
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
                    lod.tile,
                    lod.offset);
                renderables.push(renderable);
            }
        });

        return renderables;
    };


    const renderTiles = function(gl, plot, shader, quad, pyramid, atlas) {
        // update projection
        const proj = plot.viewport.getOrthoMatrix();

        // bind shader
        shader.use();

        // set uniforms
        shader.setUniform('uProjectionMatrix', proj);

        // get renderables
        const renderables = getRenderables(plot, pyramid, atlas);

        // bind texture
        atlas.texture.bind(0);
        // set texture sampler unit
        shader.setUniform('uTextureSampler', 0);

        // bind quad
        quad.bind();

        // get view offset
        const viewOffset = [
            plot.viewport.x,
            plot.viewport.y
        ];

        // for each renderable
        renderables.forEach(renderable => {
            const coord = renderable.coord;
            // set tile opacity
            shader.setUniform('uTextureCoordOffset', renderable.offset);
            // set tile scale
            const scale = Math.pow(2, plot.zoom - coord.z);
            shader.setUniform('uScale', scale);
            // get tile offset
            const tileOffset = [
                coord.x * scale * plot.tileSize,
                coord.y * scale * plot.tileSize
            ];
            const offset = [
                tileOffset[0] - viewOffset[0],
                tileOffset[1] - viewOffset[1]
            ];
            shader.setUniform('uOffset', offset);
            // draw
            quad.draw();
        });

        // unbind quad
        quad.unbind();

        // unbind
        atlas.texture.unbind();
    };

    /**
     * Class representing a texture renderer.
     */
    class TextureRenderer {

        /**
         * Instantiates a new Renderer object.
         */
        constructor() {
            this.gl = null;
            this.layer = null;
            this.quad = null;
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
            if (!layer) {
                throw 'No layer provided as argument';
            }
            this.gl = esper.WebGLContext.get();
            this.layer = layer;
            this.quad = createQuad(0, layer.plot.tileSize);
            this.shader = new esper.Shader(shader);
            this.atlas = new TextureAtlas(layer.plot.tileSize);
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
            this.quad = null;
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
            // not ready to render
            if (!this.gl || !this.layer || !this.layer.plot) {
                return;
            }
            // render the tiles to the framebuffer
            renderTiles(
                this.gl,
                this.layer.plot,
                this.shader,
                this.quad,
                this.layer.pyramid,
                this.atlas);
            return this;
        }
    }

    module.exports = TextureRenderer;

}());
