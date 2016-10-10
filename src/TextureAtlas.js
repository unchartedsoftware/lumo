(function() {

    'use strict';

    const esper = require('esper');
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

    const nextHighestPowerOfTwo = function(num) {
        if (num !== 0) {
            num = num-1;
        }
        num |= num >> 1;
        num |= num >> 2;
        num |= num >> 4;
        num |= num >> 8;
        num |= num >> 16;
        return num + 1;
    };

    const calcAtlasSize = function(numChunks, paddedSize) {
        const size = Math.ceil(Math.sqrt(numChunks));
        const pixelSize = size * paddedSize;
        return Math.ceil(nextHighestPowerOfTwo(pixelSize) / paddedSize);
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
         * @param {Number} options.numChunks - The size of the atlas, in tiles.
         * @param {boolean} options.alreadyPadded - Whether or not the tiles have already been padded.
         */
        constructor(tileSize = 256, options = {}) {
            // get context
            const gl = this.gl = esper.WebGLContext.get();
            this.numChunks = defaultTo(options.numChunks, 256);
            this.chunkSize = tileSize + (CHUNK_PADDING * 2);
            this.xSize = calcAtlasSize(this.numChunks, this.chunkSize);
            this.ySize = this.xSize;
            this.alreadyPadded = defaultTo(options.alreadyPadded, false);
            // set texture properties
            this.format = defaultTo(options.format, 'RGBA');
            this.type = defaultTo(options.type, 'UNSIGNED_BYTE');
            this.filter = defaultTo(options.filter, 'LINEAR');
            this.invertY = defaultTo(options.invertY, true);
            this.premultiplyAlpha = defaultTo(options.premultiplyAlpha, false);
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
            this.used = new Map();
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
            if (this.available.length === 0) {
                throw 'No available texture chunks in atlas';
            }
            // get an available chunk
            const chunk = this.available.pop();
            // buffer the data
            const gl = this.gl;
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
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
            // add to used
            this.used.set(key, chunk);
        }

        /**
         * Flags the chunk matching the provided key as unused in the atlas.
         *
         * @param {String} key - The key of the chunk to free.
         *
         * @returns {TextureAtlas} The TextureAtlas object, for chaining.
         */
        delete(key) {
            if (!this.has(key)) {
                throw `Tile of coord ${key} does not exist in the atlas`;
            }
            // get chunk
            const chunk = this.used.get(key);
            // remove from used
            this.used.delete(key);
            // add to available
            this.available.push(chunk);
            return this;
        }

        /**
         * Binds the texture atlas to the provided texture unit.
         *
         * @param {String} key - The texture unit to activate. Optional.
         *
         * @returns {TextureAtlas} The TextureAtlas object, for chaining.
         */
        bind(location = 0) {
            const gl = this.gl;
            gl.activeTexture(gl[`TEXTURE${location}`]);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            return this;
        }

        /**
         * Unbinds the texture atlas.
         *
         * @returns {TextureAtlas} The TextureAtlas object, for chaining.
         */
        unbind() {
            // no-op
            return this;
        }
    }

    module.exports = TextureAtlas;

}());
