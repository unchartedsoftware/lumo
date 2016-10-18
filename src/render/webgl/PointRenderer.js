'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../event/EventType');
const Shader = require('./shader/Shader');
const VertexAtlas = require('./vertex/VertexAtlas');
const WebGLRenderer = require('./WebGLRenderer');

// Constants

/**
 * Shader GLSL source.
 * @constant {Object}
 */
const SHADER_GLSL = {
	vert:
		`
		precision highp float;
		attribute vec2 aPosition;
		attribute float aRadius;
		uniform vec2 uTileOffset;
		uniform float uTileScale;
		uniform float uPixelRatio;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uTileScale) + uTileOffset;
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

// Private Methods

const renderTiles = function(gl, atlas, shader, plot, renderables, color) {
	// get projection
	const proj = plot.viewport.getOrthoMatrix();

	// bind render target
	plot.renderBuffer.bind();

	// clear render target
	gl.clear(gl.COLOR_BUFFER_BIT);

	// set blending func
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

	// bind shader
	shader.use();

	// set projection
	shader.setUniform('uProjectionMatrix', proj);

	// binds the buffer to instance
	atlas.bind();

	// set color
	shader.setUniform('uColor', color);
	// set pixel ratio
	shader.setUniform('uPixelRatio', window.devicePixelRatio);

	// for each renderable
	renderables.forEach(renderable => {
		// set tile scale
		shader.setUniform('uTileScale', renderable.scale);
		// get tile offset
		shader.setUniform('uTileOffset', renderable.tileOffset);
		// draw the points
		atlas.draw(renderable.hash, 'POINTS');
	});

	// unbind
	atlas.unbind();

	// unbind render target
	plot.renderBuffer.unbind();
};

/**
 * Class representing a pointer renderer.
 */
class PointRenderer extends WebGLRenderer {

	/**
	 * Instantiates a new PointRenderer object.
	 *
	 * @param {Options} options - The options object.
	 * @param {Array} options.color - The color of the points.
	 */
	constructor(options = {}) {
		super();
		this.shader = null;
		this.atlas = null;
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
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
		// get the extension for standard derivatives
		this.ext = this.gl.getExtension('OES_standard_derivatives');
		if (!this.ext) {
			throw 'OES_standard_derivatives WebGL extension is not supported';
		}
		this.shader = new Shader(this.gl, SHADER_GLSL);
		this.atlas = new VertexAtlas(
			this.gl,
			{
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
			}, {
				// set num chunks to be able to fit the capacity of the pyramid
				numChunks: layer.pyramid.totalCapacity
			});
		this.tileAdd = event => {
			const tile = event.tile;
			this.atlas.set(tile.coord.hash, tile.data, tile.data.length / 3);
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
			this.atlas,
			this.shader,
			this.layer.plot,
			this.getRenderables(),
			this.color);
		// render framebuffer to the backbuffer
		this.layer.plot.renderBuffer.blitToScreen(this.layer.opacity);
		return this;
	}
}

module.exports = PointRenderer;
