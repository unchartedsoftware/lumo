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
        if (arg instanceof ArrayBuffer || ArrayBuffer.isView(arg)) {
            return padBuffer(arg);
        }
        return padImage(arg);
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
            this.xSize = defaultTo(options.xSize, 16);
            this.ySize = defaultTo(options.ySize, 16);
            this.alreadyPadded = defaultTo(options.alreadyPadded, false);
            this.chunkSize = tileSize + (CHUNK_PADDING * 2);
            this.available = new Array(this.xSize * this.ySize);
            const xExtent = 1 / this.xSize;
            const yExtent = 1 / this.ySize;
            const xPixelExtent = 1 / (this.xSize * this.chunkSize);
            const yPixelExtent = 1 / (this.ySize * this.chunkSize);
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
            this.texture = new esper.Texture2D({
                width: this.chunkSize * this.xSize,
                height: this.chunkSize * this.ySize,
                src: null,
                mipMap: false,
                format: 'RGBA',
                type: 'UNSIGNED_BYTE',
                wrap: 'CLAMP_TO_EDGE',
                filter: 'LINEAR',
                invertY: true,
                premultiplyAlpha: false
            });
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
         * @param {ArrayBuffer|HTMLCanvasElement} data - The texture data.
         */
        set(key, data) {
            if (this.has(key)) {
                throw `Tile of coord ${key} already exists in the atlas`;
            }
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
            this.texture.bufferSubData(
                this.alreadyPadded ? data : padTexture(data),
                chunk.xPixelOffset,
                chunk.yPixelOffset,
                this.chunkSize,
                this.chunkSize);
        }

        bind(unit = 0) {
            this.texture.bind(unit);
        }

        unbind() {
            this.texture.unbind();
        }
    }

    module.exports = TextureAtlas;

}());
