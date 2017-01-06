'use strict';

const Texture = require('./Texture');
const Shader = require('../shader/Shader');
const VertexBuffer = require('../vertex/VertexBuffer');

// Constants

/**
 * Shader GLSL source.
 * @private
 * @constant {Object}
 */
const SHADER_GLSL = {
	vert:
		`
		precision highp float;
		attribute vec3 aVertexPosition;
		attribute vec2 aTextureCoord;
		varying vec2 vTextureCoord;
		void main(void) {
			vTextureCoord = aTextureCoord;
			gl_Position = vec4(aVertexPosition, 1.0);
		}
		`,
	frag:
		`
		precision highp float;
		uniform float uOpacity;
		uniform sampler2D uTextureSampler;
		varying vec2 vTextureCoord;
		void main(void) {
			vec4 color = texture2D(uTextureSampler, vTextureCoord);
			gl_FragColor = vec4(color.rgb, color.a * uOpacity);
		}
		`
};

// Private Methods

const createQuad = function(gl, min, max) {
	const vertices = new Float32Array(24);
	// positions
	vertices[0] = min;	   vertices[1] = min;
	vertices[2] = max;	   vertices[3] = min;
	vertices[4] = max;	   vertices[5] = max;
	vertices[6] = min;	   vertices[7] = min;
	vertices[8] = max;	   vertices[9] = max;
	vertices[10] = min;	   vertices[11] = max;
	// uvs
	vertices[12] = 0;	   vertices[13] = 0;
	vertices[14] = 1;	   vertices[15] = 0;
	vertices[16] = 1;	   vertices[17] = 1;
	vertices[18] = 0;	   vertices[19] = 0;
	vertices[20] = 1;	   vertices[21] = 1;
	vertices[22] = 0;	   vertices[23] = 1;
	// create quad buffer
	return new VertexBuffer(
		gl,
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
				byteOffset: 2 * 6 * 4
			}
		},
		{
			count: 6,
		});
};

const setColorTarget = function(gl, framebuffer, attachment, index) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(
		gl.FRAMEBUFFER,
		gl[`COLOR_ATTACHMENT${index}`],
		gl.TEXTURE_2D,
		attachment.texture,
		0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

const renderToScreen = function(gl, texture, shader, quad, opacity) {
	// bind shader
	shader.use();
	// set blending func
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	// set uniforms
	shader.setUniform('uOpacity', opacity);
	// set texture sampler unit
	shader.setUniform('uTextureSampler', 0);
	// bind texture
	texture.bind(0);
	// draw quad
	quad.bind();
	quad.draw();
	quad.unbind();
	// unbind texture
	texture.unbind();
};

/**
 * Class representing a renderbuffer.
 */
class RenderBuffer {

	/**
	 * Instantiates a RenderBuffer object.
	 *
	 * @param {WebGLRenderingContext} gl - The WebGL context.
	 * @param {Number} width - The width of the renderbuffer.
	 * @param {Number} height - The height of the renderbuffer.
	 */
	 constructor(gl, width, height) {
		this.gl = gl;
		this.framebuffer = gl.createFramebuffer();
		this.shader = new Shader(gl, SHADER_GLSL);
		this.quad = createQuad(gl, -1, 1);
		this.texture = new Texture(gl, null, {
			width: width,
			height: height,
			filter: 'NEAREST',
			invertY: false
		});
		setColorTarget(
			this.gl,
			this.framebuffer,
			this.texture,
			0);
	}

	/**
	 * Binds the renderbuffer for writing.
	 *
	 * @return {RenderBuffer} The renderbuffer object, for chaining.
	 */
	bind() {
		const gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		return this;
	}

	/**
	 * Unbinds the renderbuffer for writing.
	 *
	 * @return {RenderBuffer} The renderbuffer object, for chaining.
	 */
	unbind() {
		const gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		return this;
	}

	/**
	 * Clears the renderbuffer buffer color bits.
	 *
	 * @param {Number} r - The red clear color. (Optional)
	 * @param {Number} g - The green clear color. (Optional)
	 * @param {Number} b - The blue clear color. (Optional)
	 * @param {Number} a - The alpha clear color. (Optional)
	 *
	 * @return {RenderBuffer} The renderbuffer object, for chaining.
	 */
	clear(r, g, b, a) {
		if (r !== undefined &&
			g !== undefined &&
			b !== undefined &&
			a !== undefined) {
			this.gl.clearColor(r, g, b, a);
		}
		// clear render target
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		return this;
	}

	/**
	 * Blits the renderbuffer texture to the screen.
	 *
	 * @param {Number} opacity - The opacity to blit at.
	 *
	 * @return {RenderBuffer} The renderbuffer object, for chaining.
	 */
	blitToScreen(opacity) {
		renderToScreen(
			this.gl,
			this.texture,
			this.shader,
			this.quad,
			opacity);
		return this;
	}

	/**
	 * Resizes the renderbuffer to the provided height and width.
	 *
	 * @param {Number} width - The new width of the renderbuffer.
	 * @param {Number} height - The new height of the renderbuffer.
	 *
	 * @return {RenderBuffer} The renderbuffer object, for chaining.
	 */
	resize(width, height) {
		this.texture.resize(width, height);
		return this;
	}
}

module.exports = RenderBuffer;
