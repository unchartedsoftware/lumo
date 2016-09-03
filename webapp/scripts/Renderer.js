(function() {

    'use strict';

    const esper = require('esper');
    const glm = require('gl-matrix');

    const vert =
        `
        precision highp float;
        attribute vec2 aPosition;
        attribute vec2 aTextureCoord;
        uniform vec2 uViewOffset;
        uniform vec2 uTileOffset;
        uniform mat4 uProjectionMatrix;
        varying vec2 vTextureCoord;
        void main() {
            vTextureCoord = aTextureCoord;
            vec2 wPosition = (aPosition + uTileOffset) - uViewOffset;
            gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
        }
        `;

    const frag =
        `
        precision highp float;
        varying vec2 vTextureCoord;
        void main() {
            gl_FragColor = vec4(
                vTextureCoord.x,
                vTextureCoord.y,
                (1.0 - vTextureCoord.x),
                1.0);
        }
        `;

    const createQuad = function(tileSize) {
        const vertices = new Float32Array(24);
        // positions
        vertices[0] = 0;        vertices[1] = 0;
        vertices[2] = tileSize; vertices[3] = 0;
        vertices[4] = tileSize; vertices[5] = tileSize;
        vertices[6] = 0;        vertices[7] = 0;
        vertices[8] = tileSize; vertices[9] = tileSize;
        vertices[10] = 0;       vertices[11] = tileSize;
        // uvs
        vertices[12] = 0;       vertices[13] = 0;
        vertices[14] = 1;       vertices[15] = 0;
        vertices[16] = 1;       vertices[17] = 1;
        vertices[18] = 0;       vertices[19] = 0;
        vertices[20] = 1;       vertices[21] = 1;
        vertices[22] = 0;       vertices[23] = 1;

        const BYTES_PER_FLOAT = 4;

        return new esper.VertexBuffer(
            vertices,
            {
                0: {
                    size: 2,
                    type: 'FLOAT',
                    byteOffset: 0
                },
                1: {
                    size: 2,
                    type: 'FLOAT',
                    byteOffset: (2 * 6) * BYTES_PER_FLOAT
                }
            },
            {
                count: 6,
            });
    };

    class Renderer {
        constructor(options = {}) {
            this.options = options;
            this.layer = null;
            this.plot = null;
            this.proj = glm.mat4.create();
            this.readyToDraw = false;
        }
        activate(layer) {
            if (!layer) {
                throw 'No layer provided';
            }
            if (!layer.plot) {
                throw 'Layer has no plot';
            }
            this.layer = layer;
            this.plot = layer.plot;
            this.gl = esper.WebGLContext.get();
            this.quad = createQuad(256);
            this.shader = new esper.Shader({
                vert: vert,
                frag: frag,
            });
            this.readyToDraw = true;
        }
        deactivate() {
            if (!this.layer) {
                throw 'Renderer not attached to any layer';
            }
            this.layer = null;
            this.plot = null;
            this.gl = null;
            this.readyToDraw = false;
        }
        draw() {
            if (!this.readyToDraw) {
                return;
            }
            const gl = this.gl;
            const plot = this.plot;
            const shader = this.shader;
            const quad = this.quad;
            const tiles = this.layer.tiles;
            // update projection
            const proj = glm.mat4.ortho(
                this.proj,
                0, plot.viewport[0],
                0, plot.viewport[1],
                -1, 1);
            shader.use();
            gl.viewport(0, 0, plot.viewport[0], plot.viewport[1]);
            // set uniforms
            shader.setUniform('uProjectionMatrix', proj);
            shader.setUniform('uViewOffset', plot.viewportPx);
            // bind quad
            quad.bind();
            // for each tile
            tiles.forEach(tile => {
                // get tile offset
                const tileOffset = glm.vec2.fromValues(
                    tile.coord.x * plot.tileSize,
                    tile.coord.y * plot.tileSize);
                // set tile offset
                shader.setUniform('uTileOffset', tileOffset);
                // draw
                quad.draw();
            });
            // unbind quad
            quad.unbind();
        }
    }

    module.exports = Renderer;

}());
