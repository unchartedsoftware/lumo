'use strict';

const defaultTo = require('lodash/defaultTo');
const WebGLTileRenderer = require('../WebGLTileRenderer');

// Constants

/**
 * Numver of vertices supported per chunk.
 * @private
 * @constant {number}
 */
const CHUNK_SIZE = 128 * 128;

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
		attribute float aRadius;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform float uPixelRatio;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uScale) + uTileOffset;
			gl_PointSize = aRadius * 2.0 * uPixelRatio;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
		}
		`,
	frag:
		`
		#ifdef GL_OES_standard_derivatives
			#extension GL_OES_standard_derivatives : enable
		#endif
		precision highp float;
		uniform vec4 uColor;
		void main() {
			vec2 cxy = 2.0 * gl_PointCoord - 1.0;
			float radius = dot(cxy, cxy);
			float alpha = 1.0;
			#ifdef GL_OES_standard_derivatives
				float delta = fwidth(radius);
				alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, radius);
			#else
				if (radius > 1.0) {
					discard;
				}
			#endif
			gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
		}
		`
};

/**
 * Class representing a webgl point tile renderer.
 */
class WebGLPointTileRenderer extends WebGLTileRenderer {

	/**
	 * Instantiates a new WebGLPointTileRenderer object.
	 *
	 * @param {Object} options - The options object.
	 * @param {Array} options.color - The color of the points.
	 */
	constructor(options = {}) {
		super();
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.shader = null;
		this.atlas = null;
		this.ext = null;
	}

	/**
	 * Executed when the layer is attached to a plot.
	 *
	 * @param {Layer} layer - The layer to attach the renderer to.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	onAdd(layer) {
		super.onAdd(layer);
		// get the extension for standard derivatives
		this.ext = this.gl.getExtension('OES_standard_derivatives');
		this.shader = this.createShader(SHADER_GLSL);
		this.atlas = this.createVertexAtlas({
			chunkSize: CHUNK_SIZE,
			attributePointers: {
				// position
				0: {
					size: 2,
					type: 'FLOAT'
				},
				// radius
				1: {
					size: 1,
					type: 'FLOAT'
				}
			}
		});
		return this;
	}

	/**
	 * Executed when the layer is removed from a plot.
	 *
	 * @param {Layer} layer - The layer to remove the renderer from.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	onRemove(layer) {
		this.destroyVertexAtlas(this.atlas);
		this.atlas = null;
		this.shader = null;
		this.ext = null;
		super.onRemove(layer);
		return this;
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	draw() {
		const gl = this.gl;
		const shader = this.shader;
		const atlas = this.atlas;
		const plot = this.layer.plot;
		const renderables = this.getRenderables();
		const proj = this.getOrthoMatrix();

		// bind render target
		plot.renderBuffer.bind();
		// clear render target
		plot.renderBuffer.clear();

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

		// bind shader
		shader.use();

		// set global uniforms
		shader.setUniform('uProjectionMatrix', proj);
		shader.setUniform('uColor', this.color);
		shader.setUniform('uPixelRatio', plot.pixelRatio);

		// binds the vertex atlas
		atlas.bind();

		// for each renderable
		for (let i=0; i<renderables.length; i++) {
			const renderable = renderables[i];
			// set tile uniforms
			shader.setUniform('uScale', renderable.scale);
			shader.setUniform('uTileOffset', renderable.tileOffset);
			// draw the points
			atlas.draw(renderable.hash, 'POINTS');
		}

		// unbind
		atlas.unbind();

		// unbind render target
		plot.renderBuffer.unbind();

		// render framebuffer to the backbuffer
		plot.renderBuffer.blitToScreen(this.layer.opacity);

		return this;
	}
}

module.exports = WebGLPointTileRenderer;
