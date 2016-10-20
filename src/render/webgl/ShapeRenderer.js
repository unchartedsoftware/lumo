'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../event/EventType');
const Shader = require('./shader/Shader');
const VertexAtlas = require('./vertex/VertexAtlas');
const VertexBuffer = require('./vertex/VertexBuffer');
const WebGLRenderer = require('./WebGLRenderer');

// Constants

/**
 * Inner radius of star.
 * @constant {Number}
 */
const STAR_INNER_RADIUS = 0.4;

/**
 * Outer radius of star.
 * @constant {Number}
 */
const STAR_OUTER_RADIUS = 1.0;

/**
 * Number of points on the star.
 * @constant {Number}
 */
const STAR_NUM_POINTS = 5;

/**
 * Shader GLSL source.
 * @constant {Object}
 */
const SHADER_GLSL = {
	vert:
		`
		precision highp float;
		attribute vec2 aPosition;
		attribute vec2 aOffset;
		attribute float aRadius;
		uniform vec2 uTileOffset;
		uniform float uTileScale;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * aRadius) + (aOffset * uTileScale) + uTileOffset;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
		}
		`,
	frag:
		`
		precision highp float;
		uniform vec4 uColor;
		void main() {
			gl_FragColor = uColor;
		}
		`
};

// Private Methods

const createStar = function(gl) {
	const theta = (2 * Math.PI) / STAR_NUM_POINTS;
	const htheta = theta / 2.0;
	const qtheta = theta / 4.0;
	const positions = new Float32Array((STAR_NUM_POINTS * 2) * 2 + 4);
	positions[0] = 0;
	positions[1] = 0;
	for (let i=0; i<STAR_NUM_POINTS; i++) {
		const angle = i * theta;
		let sx = Math.cos(angle - qtheta) * STAR_INNER_RADIUS;
		let sy = Math.sin(angle - qtheta) * STAR_INNER_RADIUS;
		positions[i*4+2] = sx;
		positions[i*4+1+2] = sy;
		sx = Math.cos(angle + htheta - qtheta) * STAR_OUTER_RADIUS;
		sy = Math.sin(angle + htheta - qtheta) * STAR_OUTER_RADIUS;
		positions[i*4+2+2] = sx;
		positions[i*4+3+2] = sy;
	}
	positions[positions.length-2] = positions[2];
	positions[positions.length-1] = positions[3];
	return new VertexBuffer(
		gl,
		positions,
		{
			0: {
				size: 2,
				type: 'FLOAT'
			}
		},
		{
			mode: 'TRIANGLE_FAN',
			count: positions.length / 2
		});
};

const renderTiles = function(gl, atlas, shape, shader, plot, renderables, color) {
	// get projection
	const proj = plot.viewport.getOrthoMatrix();

	// bind render target
	plot.renderBuffer.bind();

	// clear viewport
	gl.clear(gl.COLOR_BUFFER_BIT);

	// set blending func
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

	// bind shader
	shader.use();

	// set projection
	shader.setUniform('uProjectionMatrix', proj);
	// set color
	shader.setUniform('uColor', color);

	// bind shape
	shape.bind();

	// binds the buffer to instance
	atlas.bindInstanced();

	// for each renderable
	renderables.forEach(renderable => {
		// set tile scale
		shader.setUniform('uTileScale', renderable.scale);
		// get tile offset
		shader.setUniform('uTileOffset', renderable.tileOffset);
		// draw the instances
		atlas.drawInstanced(renderable.hash, shape.mode, shape.count);
	});

	// unbind
	atlas.unbindInstanced();

	// unbind quad
	shape.unbind();

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
		this.shape = null;
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
		this.shape = createStar(this.gl);
		this.shader = new Shader(this.gl, SHADER_GLSL);
		this.atlas = new VertexAtlas(
			this.gl,
			{
				// offset
				1: {
					size: 2,
					type: 'FLOAT'
				},
				// radius
				2: {
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
		this.layer.removeListener(this.tileAdd);
		this.layer.removeListener(this.tileRemove);
		this.tileAdd = null;
		this.tileRemove = null;
		this.shape = null;
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
			this.shape,
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
