'use strict';

const defaultTo = require('lodash/defaultTo');
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
		uniform float uScale;
		uniform float uPixelRatio;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uScale) + uTileOffset;
			gl_PointSize = (aRadius + uRadiusOffset) * uScale * 2.0 * uPixelRatio;
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

const renderTiles = function(atlas, shader, renderables, color) {
	// set global uniforms
	shader.setUniform('uColor', color);
	shader.setUniform('uRadiusOffset', 0);

	// binds the buffer to instance
	atlas.bind();

	// for each renderable
	renderables.forEach(renderable => {
		// set tile uniforms
		shader.setUniform('uScale', renderable.scale);
		shader.setUniform('uTileOffset', renderable.tileOffset);
		// draw points
		atlas.draw(renderable.hash, 'POINTS');
	});

	// unbind
	atlas.unbind();
};

const renderPoint = function(point, shader, plot, target, color, radius) {
	// get tile offset
	const coord = target.tile.coord;
	const scale = Math.pow(2, plot.zoom - coord.z);
	const tileOffset = [
		(coord.x * scale * plot.tileSize) + (scale * target.x) - plot.viewport.x,
		(coord.y * scale * plot.tileSize) + (scale * target.y) - plot.viewport.y
	];
	// set uniforms
	shader.setUniform('uTileOffset', tileOffset);
	shader.setUniform('uScale', scale);
	shader.setUniform('uColor', color);
	shader.setUniform('uRadiusOffset', radius + target.radius);

	// binds the buffer to instance
	point.bind();

	// draw the points
	point.draw();

	// unbind
	point.unbind();
};

/**
 * Class representing an interactive point renderer.
 */
class InteractiveRenderer extends WebGLInteractiveRenderer {

	/**
	 * Instantiates a new InteractiveRenderer object.
	 *
	 * @param {Object} options - The options object.
	 * @param {Array} options.xField - The X field of the data.
	 * @param {Array} options.yField - The Y field of the data.
	 * @param {Array} options.radiusField - The radius field of the data.
	 * @param {Array} options.color - The color of the points.
	 */
	constructor(options = {}) {
		super(options);
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
		this.point = createPoint(this.gl);
		this.shader = this.createShader(SHADER_GLSL);
		this.atlas = this.createVertexAtlas({
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
		});
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
		this.destroyVertexAtlas(this.atlas);
		this.atlas = null;
		this.shader = null;
		this.point = null;
		super.onRemove(layer);
		return this;
	}

	/**
	 * Executed when a tile is added to the layer pyramid.
	 *
	 * @param {VertexAtlas} atlas - The vertex atlas object.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	addTile(atlas, tile) {
		const coord = tile.coord;
		const data = tile.data;
		const tileSize = this.layer.plot.tileSize;
		const xOffset = coord.x * tileSize;
		const yOffset = coord.y * tileSize;
		const xField = this.xField;
		const yField = this.yField;
		const radiusField = this.radiusField;
		const points = new Array(data.length);
		const vertices = new Float32Array(data.length * 3);
		for (let i=0; i<data.length; i++) {
			const datum = data[i];
			// get point attributes
			const x = datum[xField];
			const y = datum[yField];
			const radius = datum[radiusField];
			// convert to plot pixels
			const plotX = x + xOffset;
			const plotY = y + yOffset;
			// add to buffer
			vertices[i*3] = x;
			vertices[i*3+1] = y;
			vertices[i*3+2] = radius;
			// add to points
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
		// index points
		this.addPoints(coord, points);
		// add to atlas
		atlas.set(coord.hash, vertices, points.length);
	}

	/**
	 * Executed when a tile is removed from the layer pyramid.
	 *
	 * @param {VertexAtlas} atlas - The vertex atlas object.
	 * @param {Tile} tile - The new tile object containing data.
	 */
	removeTile(atlas, tile) {
		const coord = tile.coord;
		// remove from atlas
		atlas.delete(coord.hash);
		// unindex points
		this.removePoints(coord);
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
		const plot = this.layer.plot;
		const projection = this.getOrthoMatrix();
		const shader = this.shader;

		// bind render target
		plot.renderBuffer.bind();
		// clear render target
		plot.renderBuffer.clear();

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

		// use shader
		shader.use();

		// set uniforms
		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uPixelRatio', plot.pixelRatio);

		// render the tiles
		renderTiles(
			this.atlas,
			shader,
			this.getRenderables(),
			this.color);

		// render selected
		this.selected.forEach(selected => {
			renderPoint(
				this.point,
				shader,
				plot,
				selected,
				this.color,
				SELECTED_RADIUS_OFFSET);
		});

		// render highlighted
		if (this.highlighted &&
			this.selected.indexOf(this.highlighted) === -1) {
			renderPoint(
				this.point,
				shader,
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
