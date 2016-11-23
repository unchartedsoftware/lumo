'use strict';

const VertexBuffer = require('./vertex/VertexBuffer');
const WebGLTextureRenderer = require('./WebGLTextureRenderer');

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
		attribute vec2 aPosition;
		attribute vec2 aTextureCoord;
		uniform vec4 uTextureCoordOffset;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform mat4 uProjectionMatrix;
		varying vec2 vTextureCoord;
		void main() {
			vTextureCoord = vec2(
				uTextureCoordOffset.x + (aTextureCoord.x * uTextureCoordOffset.z),
				uTextureCoordOffset.y + (aTextureCoord.y * uTextureCoordOffset.w));
			vec2 wPosition = (aPosition * uScale) + uTileOffset;
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
			vec4 color = texture2D(uTextureSampler, vec2(vTextureCoord.x, 1.0 - vTextureCoord.y));
			gl_FragColor = vec4(color.rgb, color.a * uOpacity);
		}
		`
};

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

/**
 * Class representing a renderer.
 */
class TextureRenderer extends WebGLTextureRenderer {

	/**
	 * Instantiates a new TextureRenderer object.
	 */
	constructor(options = {}) {
		super(options);
		this.quad = null;
		this.shader = null;
		this.array = null;
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
		this.quad = createQuad(this.gl, 0, layer.plot.tileSize);
		this.shader = this.createShader(SHADER_GLSL);
		this.array = this.createTextureArray(layer.plot.tileSize);
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
		this.destroyTextureArray(this.array);
		this.array = null;
		this.quad = null;
		this.shader = null;
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
		const shader = this.shader;
		const array = this.array;
		const quad = this.quad;
		const renderables = this.getRenderablesLOD();
		const proj = this.getOrthoMatrix();

		// bind shader
		shader.use();
		// set global uniforms
		shader.setUniform('uProjectionMatrix', proj);
		shader.setUniform('uTextureSampler', 0);
		shader.setUniform('uOpacity', this.layer.opacity);

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// bind quad
		quad.bind();

		let last;
		// for each renderable
		renderables.forEach(renderable => {
			const hash = renderable.hash;
			if (last !== hash) {
				// bind texture
				array.bind(hash, 0);
				last = hash;
			}
			// set tile uniforms
			shader.setUniform('uTextureCoordOffset', renderable.uvOffset);
			shader.setUniform('uScale', renderable.scale);
			shader.setUniform('uTileOffset', renderable.tileOffset);
			// draw
			quad.draw();
			// no need to unbind texture
		});

		// unbind quad
		quad.unbind();
		return this;
	}
}

module.exports = TextureRenderer;
