(function() {

    'use strict';

    const esper = require('esper');
    const EventType = require('../../event/EventType');
    const WebGLRenderer = require('./WebGLRenderer');
    const TextureAtlas = require('./TextureAtlas');

    const shader = {
        vert:
            `
            precision highp float;
            attribute vec2 aPosition;
            attribute vec2 aTextureCoord;
            uniform vec4 uTextureCoordOffset;
            uniform vec2 uTileOffset;
            uniform float uTileScale;
            uniform mat4 uProjectionMatrix;
            varying vec2 vTextureCoord;
            void main() {
                vTextureCoord = vec2(
                    uTextureCoordOffset.x + (aTextureCoord.x * uTextureCoordOffset.z),
                    uTextureCoordOffset.y + (aTextureCoord.y * uTextureCoordOffset.w));
                vec2 wPosition = (aPosition * uTileScale) + uTileOffset;
                gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
            }
            `,
        frag:
            `
            precision highp float;
            uniform sampler2D uTextureSampler;
            uniform float uOpacity;
            varying vec2 vTextureCoord;
            void main() {
                vec4 color = texture2D(uTextureSampler, vTextureCoord);
                gl_FragColor = vec4(color.rgb, color.a * uOpacity);
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

    const getRenderable = function(atlas, coord, zoom, tile, offset) {
        const ncoord = tile.coord.normalize();
        const chunk = atlas.get(ncoord.hash);
        const scale = Math.pow(2, zoom - coord.z);
        return {
            coord: coord,
            scale: scale,
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
                    plot.zoom,
                    lod.tile,
                    lod.offset);
                renderables.push(renderable);
            }
        });

        return renderables;
    };

    const renderTiles = function(gl, shader, quad, atlas, plot, pyramid, opacity) {
        // get projection
        const proj = plot.viewport.getOrthoMatrix();

        // bind shader
        shader.use();

        // set projection
        shader.setUniform('uProjectionMatrix', proj);
        // set texture sampler unit
        shader.setUniform('uTextureSampler', 0);
        // set opacity
        shader.setUniform('uOpacity', opacity);

        // set blending func
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // bind quad
        quad.bind();

        // get view offset
        const viewOffset = [
            plot.viewport.x,
            plot.viewport.y
        ];

        // bind texture atlas
        atlas.bind(0);

        // get renderables
        const renderables = getRenderables(plot, pyramid, atlas);

        // for each renderable
        renderables.forEach(renderable => {
            const coord = renderable.coord;
            // set tile opacity
            shader.setUniform('uTextureCoordOffset', renderable.offset);
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
            // draw
            quad.draw();
        });

        // unbind quad
        quad.unbind();

        // unbind texture atlas
        atlas.unbind();
    };

    /**
     * Class representing a texture atlas renderer.
     */
    class TextureAtlasRenderer extends WebGLRenderer {

        /**
         * Instantiates a new TextureAtlasRenderer object.
         */
        constructor() {
            super();
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
            super.onAdd(layer);
            this.quad = createQuad(0, layer.plot.tileSize);
            this.shader = new esper.Shader(shader);
            this.atlas = new TextureAtlas(layer.plot.tileSize, {
                // set num chunks to be able to fit the capacity of the pyramid
                numChunks: layer.pyramid.totalCapacity
            });
            this.tileAdd = event => {
                const tile = event.tile;
                this.atlas.set(tile.coord.hash, tile.data);
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
            this.quad = null;
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
                this.shader,
                this.quad,
                this.atlas,
                this.layer.plot,
                this.layer.pyramid,
                this.layer.opacity);
            return this;
        }
    }

    module.exports = TextureAtlasRenderer;

}());
