(function() {

    'use strict';

    /**
     * Class representing a render buffer.
     */
    class RenderBuffer {

        /**
         * Instantiates a RenderBuffer object.
         *
         * @param {WebGLRenderingContext} gl - The WebGL context.
         */
         constructor(gl) {
            this.gl = gl;
            this.framebuffer = gl.createFramebuffer();
            this.textures = new Map();
        }

        /**
         * Binds the renderbuffer object.
         *
         * @return {RenderBuffer} The renderbuffer object, for chaining.
         */
        bind() {
            // bind framebuffer
            const gl = this.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            return this;
        }

        /**
         * Unbinds the renderbuffer object.
         *
         * @return {RenderBuffer} The renderbuffer object, for chaining.
         */
        unbind() {
            // unbind framebuffer
            const gl = this.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return this;
        }

        /**
         * Attaches the provided texture to the provided attachment location.
         *
         * @param {Texture2D} texture - The texture to attach.
         * @param {Number} index - The attachment index. Optional.
         *
         * @return {RenderBuffer} The renderbuffer object, for chaining.
         */
        setColorTarget(texture, index = 0) {
            const gl = this.gl;
            if (!texture) {
                throw 'Texture argument is missing';
            }
            const attachment = `COLOR_ATTACHMENT${index}`;
            this.textures.set(attachment, texture);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl[attachment],
                gl.TEXTURE_2D,
                texture.texture,
                0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return this;
        }

        /**
         * Resizes the renderbuffer and all attached textures by the provided height and width.
         *
         * @param {Number} width - The new width of the renderbuffer.
         * @param {Number} height - The new height of the renderbuffer.
         *
         * @return {RenderBuffer} The renderbuffer object, for chaining.
         */
        resize(width, height) {
            this.textures.forEach(texture => {
                texture.resize(width, height);
            });
            return this;
        }
    }

    module.exports = RenderBuffer;

}());
