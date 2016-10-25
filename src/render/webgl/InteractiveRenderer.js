'use strict';

const defaultTo = require('lodash/defaultTo');
const get = require('lodash/get');
const EventType = require('../../event/EventType');
const Shader = require('./shader/Shader');
const VertexAtlas = require('./vertex/VertexAtlas');
const VertexBuffer = require('./vertex/VertexBuffer');
const WebGLInteractiveRenderer = require('./WebGLInteractiveRenderer');

// Constants

/**
 * Highlighted point radius increase.
 * @private
 * @constant {Number}
 */
const HIGHLIGHTED_RADIUS_OFFSET = 2;

/**
 * Selected point radius increase.
 * @private
 * @constant {Number}
 */
const SELECTED_RADIUS_OFFSET = 4;

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
		uniform float uRadiusOffset;
		uniform vec2 uTileOffset;
		uniform float uTileScale;
		uniform float uPixelRatio;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uTileScale) + uTileOffset;
			gl_PointSize = (aRadius + uRadiusOffset) * 2.0 * uPixelRatio;
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

const createPoint = function(gl) {
	const vertices = new Float32Array(2);
	vertices[0] = 0.0;
	vertices[1] = 0.0;
	// create quad buffer
	return new VertexBuffer(
		gl,
		vertices,
		{
			0: {
				size: 2,
				type: 'FLOAT',
				byteOffset: 0
			}
		},
		{
			mode: 'POINTS',
			count: 1
		});
};

const renderTiles = function(gl, atlas, shader, proj, renderables, color) {

	// clear render target
	gl.clear(gl.COLOR_BUFFER_BIT);

	// set blending func
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

	shader.setUniform('uColor', color);
	shader.setUniform('uRadiusOffset', 0);

	// binds the buffer to instance
	atlas.bind();

	// for each renderable
	renderables.forEach(renderable => {
		shader.setUniform('uTileScale', renderable.scale);
		shader.setUniform('uTileOffset', renderable.tileOffset);
		atlas.draw(renderable.hash, 'POINTS');
	});

	// unbind
	atlas.unbind();
};

const renderPoint = function(gl, point, shader, proj, plot, target, color, radius) {

	// get tile offset
	const coord = target.tile.coord;
	const scale = Math.pow(2, plot.zoom - coord.z);
	const tileOffset = [
		(coord.x * scale * plot.tileSize) + (scale * target.x) - plot.viewport.x,
		(coord.y * scale * plot.tileSize) + (scale * target.y) - plot.viewport.y
	];
	shader.setUniform('uTileOffset', tileOffset);
	shader.setUniform('uTileScale', scale);
	shader.setUniform('uColor', color);
	shader.setUniform('uRadiusOffset', radius + target.radius);

	// binds the buffer to instance
	point.bind();

	// draw the points
	point.draw();

	// unbind
	point.unbind();
};

const addTile = function(renderer, event) {
	const tile = event.tile;
	const coord = tile.coord;
	const data = tile.data;

	const tileSize = renderer.layer.plot.tileSize;
	const xOffset = coord.x * tileSize;
	const yOffset = coord.y * tileSize;

	const xField = renderer.xField;
	const yField = renderer.yField;
	const radiusField = renderer.radiusField;

	const points = new Array(data.length);
	const vertices = new Float32Array(data.length * 3);

	for (let i=0; i<data.length; i++) {
		const datum = data[i];

		const x = get(datum, xField);
		const y = get(datum, yField);
		const radius = get(datum, radiusField);

		const plotX = x + xOffset;
		const plotY = y + yOffset;

		vertices[i*3] = x;
		vertices[i*3+1] = y;
		vertices[i*3+2] = radius;

		points[i] = {
			x: x,
			y: y,
			radius: radius,
			minX: plotX - radius,
			maxX: plotX + radius,
			minY: plotY - radius,
			maxY: plotY + radius,
			tile: tile,
			data: datum
		};
	}

	renderer.addPoints(coord, points);
	renderer.atlas.set(coord.hash, vertices, points.length);
};

const removeTile = function(renderer, event) {
	const tile = event.tile;
	const coord = tile.coord;
	renderer.atlas.delete(coord.hash);
	renderer.removePoints(coord);
};

/**
 * Class representing an interactive point renderer.
 */
class InteractiveRenderer extends WebGLInteractiveRenderer {

	/**
	 * Instantiates a new InteractiveRenderer object.
	 *
	 * @param {Options} options - The options object.
	 * @param {Array} options.xField - The X field of the data.
	 * @param {Array} options.yField - The Y field of the data.
	 * @param {Array} options.radiusField - The radius field of the data.
	 * @param {Array} options.color - The color of the points.
	 */
	constructor(options = {}) {
		super();
		this.shader = null;
		this.point = null;
		this.atlas = null;
		this.xField = defaultTo(options.xField, 'x');
		this.yField = defaultTo(options.yField, 'y');
		this.radiusField = defaultTo(options.radiusField, 'radius');
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

		this.shader = new Shader(this.gl, SHADER_GLSL);

		this.point = createPoint(this.gl);
		this.atlas = new VertexAtlas(
			this.gl,
			{
				0: {
					size: 2,
					type: 'FLOAT'
				},
				1: {
					size: 1,
					type: 'FLOAT'
				}
			}, {
				// set num chunks to be able to fit the capacity of the pyramid
				numChunks: layer.pyramid.totalCapacity
			});

		this.tileAdd = event => {
			addTile(this, event);
		};

		this.tileRemove = event => {
			removeTile(this, event);
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
		this.layer.removeListener(EventType.TILE_ADD, this.tileAdd);
		this.layer.removeListener(EventType.TILE_REMOVE, this.tileRemove);
		this.tileAdd = null;
		this.tileRemove = null;

		this.shader = null;

		this.atlas = null;
		this.point = null;

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

		const plot = this.layer.plot;
		const projection = plot.viewport.getOrthoMatrix();
		const shader = this.shader;

		// bind render target
		plot.renderBuffer.bind();

		// use shader
		shader.use();

		// set uniforms
		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uPixelRatio', plot.pixelRatio);

		// render the tiles
		renderTiles(
			this.gl,
			this.atlas,
			shader,
			projection,
			this.getRenderables(),
			this.color);

		// render selected
		if (this.selected) {
			renderPoint(
				this.gl,
				this.point,
				shader,
				projection,
				plot,
				this.selected,
				this.color,
				SELECTED_RADIUS_OFFSET);
		}

		// render highlighted
		if (this.highlighted && this.highlighted !== this.selected) {
			renderPoint(
				this.gl,
				this.point,
				shader,
				projection,
				plot,
				this.highlighted,
				this.color,
				HIGHLIGHTED_RADIUS_OFFSET);
		}

		// unbind render target
		plot.renderBuffer.unbind();

		// render framebuffer to the backbuffer
		plot.renderBuffer.blitToScreen(this.layer.opacity);
		return this;
	}
}

module.exports = InteractiveRenderer;
