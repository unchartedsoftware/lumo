'use strict';

const defaultTo = require('lodash/defaultTo');
const EventType = require('../../../event/EventType');
const CircleCollidable = require('../../../geometry/CircleCollidable');
const VertexBuffer = require('../../../webgl/vertex/VertexBuffer');
const WebGLVertexTileRenderer = require('./WebGLVertexTileRenderer');

// Constants

/**
 * Zoom start event handler symbol.
 * @private
 * @constant {Symbol}
 */
const ZOOM_START = Symbol();

/**
 * Highlighted point radius increase.
 * @private
 * @constant {number}
 */
const HIGHLIGHTED_RADIUS_OFFSET = 2;

/**
 * Selected point radius increase.
 * @private
 * @constant {number}
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
				type: 'FLOAT'
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
	for (let i=0; i<renderables.length; i++) {
		const renderable = renderables[i];
		// set tile uniforms
		shader.setUniform('uScale', renderable.scale);
		shader.setUniform('uTileOffset', renderable.tileOffset);
		// draw points
		atlas.draw(renderable.hash, 'POINTS');
	}

	// unbind
	atlas.unbind();
};

const renderPoint = function(point, shader, plot, target, color, radius) {
	// get tile offset
	const coord = target.tile.coord;
	const scale = Math.pow(2, plot.zoom - coord.z);
	const viewport = plot.getViewportPixelOffset();
	const tileOffset = [
		(coord.x * scale * plot.tileSize) + (scale * target.x) - viewport.x,
		(coord.y * scale * plot.tileSize) + (scale * target.y) - viewport.y
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
 * Class representing a webgl interactive point tile renderer.
 */
class InteractiveRenderer extends WebGLVertexTileRenderer {

	/**
	 * Instantiates a new InteractiveRenderer object.
	 *
	 * @param {Object} options - The options object.
	 * @param {Array} options.color - The color of the points.
	 */
	constructor(options = {}) {
		super(options);
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.shader = null;
		this.point = null;
		this.tree = null;
		this.atlas = null;
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
		this.point = createPoint(this.gl);
		this.shader = this.createShader(SHADER_GLSL);
		this.tree = this.createRTreePyramid(32);
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
		// create handler
		this[ZOOM_START] = () => {
			// clear on zoom since we won't be able to match the same data
			this.layer.clear();
		};
		// attach handler
		layer.plot.on(EventType.ZOOM_START, this[ZOOM_START]);
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
		// detach handler
		this.layer.plot.removeListener(EventType.ZOOM_START, this[ZOOM_START]);
		// destroy handler
		this[ZOOM_START] = null;
		this.destroyVertexAtlas(this.atlas);
		this.destroyRTreePyramid(this.tree);
		this.atlas = null;
		this.shader = null;
		this.point = null;
		this.tree = null;
		super.onRemove(layer);
		return this;
	}

	/**
	 * Given a tile, returns an array of collidable objects. A collidable object
	 * is any object that contains `minX`, `minY`, `maxX`, and `maxY` properties.
	 *
	 * @param {Tile} tile - The tile of data.
	 * @param {number} xOffset - The pixel x offset of the tile.
	 * @param {number} yOffset - The pixel y offset of the tile.
	 */
	createCollidables(tile, xOffset, yOffset) {
		const data = tile.data;
		const collidables = new Array(data.length / 3);
		for (let i=0; i<data.length; i+=3) {
			// add to points
			collidables[i/3] = new CircleCollidable(
				data[i], // x
				data[i+1], // y
				data[i+2], // radius
				xOffset,
				yOffset,
				tile);
		}
		return collidables;
	}

	/**
	 * Pick a position of the renderer for a collision with any rendered objects.
	 *
	 * @param {Object} pos - The plot position to pick at.
	 *
	 * @returns {Object} The collision, if any.
	 */
	pick(pos) {
		return this.tree.searchPoint(
			pos.x,
			pos.y,
			this.layer.plot.zoom,
			this.layer.plot.getPixelExtent());
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {Renderer} The renderer object, for chaining.
	 */
	draw() {
		const gl = this.gl;
		const layer = this.layer;
		const plot = layer.plot;
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
		layer.getSelected().forEach(selected => {
			renderPoint(
				this.point,
				shader,
				plot,
				selected,
				this.color,
				SELECTED_RADIUS_OFFSET);
		});

		// render highlighted
		const highlighted = layer.getHighlighted();
		if (highlighted && !layer.isSelected(highlighted)) {
			renderPoint(
				this.point,
				shader,
				plot,
				highlighted,
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
