(function() {

    'use strict';

    const esper = require('esper');
    const LRU = require('lru-cache');
    const defaultTo = require('lodash/defaultTo');

    // Constants

    /**
     * Padding of the individual texture chunks.
     * @constant {Number}
     */
    const CHUNK_PADDING = 1;

    // Private Methods
    const padImage = function(image) {
        const canvas = document.createElement('canvas');
        const width = image.width;
        const height = image.height;
        canvas.height = width + (CHUNK_PADDING * 2);
        canvas.width = height + (CHUNK_PADDING * 2);
        const context = canvas.getContext('2d');
        // blit the scaled image first to pad the image
        // NOTE: this is slightly faster than blitting the edges individually
        context.drawImage(image,
            0, 0,
            width, height,
            0, 0,
            width + (CHUNK_PADDING * 2), height + (CHUNK_PADDING * 2));
        // blit the image into the center
        context.drawImage(image,
            0, 0,
            width, height,
            CHUNK_PADDING, CHUNK_PADDING,
            width, height);
        return canvas;
    };

    const padBuffer = function(buffer) {
        const size = Math.sqrt(buffer.length / 4);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const imgData = context.createImageData(size, size);
        imgData.data.set(buffer);
        context.putImageData(imgData, 0, 0);
        return padImage(canvas);
    };

    const padTexture = function(arg) {
        if (arg.width && arg.height) {
            return padImage(arg);
        }
        return padBuffer(arg);
    };

    /**
     * Class representing a texture atlas.
     */
    class TextureAtlas {

        /**
         * Instantiates a new TextureAtlas object.
         *
         * @param {Number} tileSize - The size of a tile, in pixels.
         * @param {Object} options - The parameters of the animation.
         * @param {Number} options.xSize - The horizontal size of the atlas, in tiles.
         * @param {Number} options.ySize - The vertical size of the atlas, in tiles.
         * @param {boolean} options.alreadyPadded - Whether or not the tiles have already been padded.
         */
        constructor(tileSize, options = {}) {
            // get context
            const gl = this.gl = esper.WebGLContext.get();
            this.xSize = defaultTo(options.xSize, 16);
            this.ySize = defaultTo(options.ySize, 16);
            this.alreadyPadded = defaultTo(options.alreadyPadded, false);
            // set texture properties
            this.format = defaultTo(options.format, 'RGBA');
            this.type = defaultTo(options.type, 'UNSIGNED_BYTE');
            this.filter = defaultTo(options.filter, 'LINEAR');
            this.invertY = defaultTo(options.invertY, true);
            this.premultiplyAlpha = defaultTo(options.premultiplyAlpha, false);
            // set chunksize
            this.chunkSize = tileSize + (CHUNK_PADDING * 2);
            // set dimensions
            this.width = this.chunkSize * this.xSize;
            this.height = this.chunkSize * this.ySize;
            this.available = new Array(this.xSize * this.ySize);
            const xExtent = 1 / this.xSize;
            const yExtent = 1 / this.ySize;
            const xPixelExtent = 1 / this.width;
            const yPixelExtent = 1 / this.height;
            for (let i=0; i<this.xSize; i++) {
                for (let j=0; j<this.ySize; j++) {
                    this.available[i*this.ySize + j] = {
                        xPixelOffset: i * this.chunkSize,
                        yPixelOffset: j * this.chunkSize,
                        xOffset: (i / this.xSize) + xPixelExtent,
                        yOffset: (j / this.ySize) + yPixelExtent,
                        xExtent: xExtent - (xPixelExtent * 2),
                        yExtent: yExtent - (yPixelExtent * 2)
                    };
                }
            }
            this.used = new LRU({
                max: this.xSize * this.ySize,
                dispose: (key, chunk) => {
                    // flag the chunk as available
                    this.available.push(chunk);
                }
            });
            // create texture
            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.invertY);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);
            // buffer the data
            gl.texImage2D(
                gl.TEXTURE_2D,
                0, // mip-map level
                gl[this.format], // webgl requires format === internalFormat
                this.width,
                this.height,
                0, // border, must be 0
                gl[this.format],
                gl[this.type],
                null);
            // set parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[this.filter]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[this.filter]);
        }

        /**
         * Test whether or not a key is held in the atlas.
         *
         * @param {String} key - The key to test.
         *
         * @returns {boolean} Whether or not the coord exists in the pyramid.
         */
        has(key) {
            return this.used.has(key);
        }

        /**
         * Returns the chunk matching the provided key. If the chunk does not
         * exist, returns undefined.
         *
         * @param {String} key - The key of the chunk to return.
         *
         * @returns {Object} The chunk object.
         */
        get(key) {
            return this.used.get(key);
        }

        /**
         * Set the texture data for the provided key.
         *
         * @param {String} key - The key of the texture data.
         * @param {ArrayBuffer|HTMLCanvasElement|HTMLImageElement} data - The texture data.
         */
        set(key, data) {
            if (this.has(key)) {
                throw `Tile of coord ${key} already exists in the atlas`;
            }
            const gl = this.gl;
            // first create chunk
            const chunk = {
                xPixelOffset: 0,
                yPixelOffset: 0,
                xOffset: 0,
                yOffset: 0,
                xExtent: 0,
                yExtent: 0
            };
            // add to cache, this guarentees we have an available chunk
            this.used.set(key, chunk);
            // get an available chunk
            const available = this.available.pop();
            // copy over the attributes
            chunk.xPixelOffset = available.xPixelOffset;
            chunk.yPixelOffset = available.yPixelOffset;
            chunk.xOffset = available.xOffset;
            chunk.yOffset = available.yOffset;
            chunk.xExtent = available.xExtent;
            chunk.yExtent = available.yExtent;
            // buffer the data
            if (data.width && data.height) {
                // canvas type
                gl.texSubImage2D(
                    gl.TEXTURE_2D,
                    0, // mip-map level
                    chunk.xPixelOffset,
                    chunk.yPixelOffset,
                    gl[this.format],
                    gl[this.type],
                    this.alreadyPadded ? data : padTexture(data));
            } else {
                // arraybuffer type
                gl.texSubImage2D(
                    gl.TEXTURE_2D,
                    0, // mip-map level
                    chunk.xPixelOffset,
                    chunk.yPixelOffset,
                    this.chunkSize,
                    this.chunkSize,
                    gl[this.format],
                    gl[this.type],
                    this.alreadyPadded ? data : padTexture(data));
            }
        }

        bind(location = 0) {
            const gl = this.gl;
            gl.activeTexture(gl[`TEXTURE${location}`]);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }

        unbind() {
            // no-op
        }
    }

    module.exports = TextureAtlas;

}());
