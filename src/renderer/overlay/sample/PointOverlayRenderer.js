'use strict';

const defaultTo = require('lodash/defaultTo');
const VertexBuffer = require('../../../webgl/vertex/VertexBuffer');
const WebGLOverlayRenderer = require('../WebGLOverlayRenderer');

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
		attribute vec2 aNormal;
		uniform vec2 uViewOffset;
		uniform float uScale;
		uniform float uLineWidth;
		uniform float uPixelRatio;
		uniform float uPointRadius;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uScale) - uViewOffset;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
			gl_PointSize = uPointRadius * 2.0 * uPixelRatio;
		}
		`,
	frag:
		`
		#ifdef GL_OES_standard_derivatives
			#extension GL_OES_standard_derivatives : enable
		#endif
		precision highp float;
		uniform vec4 uPointColor;
		uniform float uOpacity;
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
			gl_FragColor = vec4(uPointColor.rgb, uPointColor.a * alpha * uOpacity);
		}
		`
};

// Private Methods

const bufferPoints = function(points) {
	const buffer = new Float32Array(points.length * 2);
	for (let i=0; i<points.length; i++) {
		const point = points[i];
		buffer[i*2] = point.x;
		buffer[i*2+1] = point.y;
	}
	return buffer;
};

const createVertexBuffer = function(gl, points) {
	const data = bufferPoints(points);
	return new VertexBuffer(
		gl,
		data,
		{
			0: {
				size: 2,
				type: 'FLOAT'
			}
		},
		{
			mode: 'POINTS',
			count: points.length
		});
};

/**
 * Class representing a webgl point overlay renderer.
 */
class PointOverlayRenderer extends WebGLOverlayRenderer {

	/**
	 * Instantiates a new PointOverlayRenderer object.
	 *
	 * @param {Object} options - The overlay options.
	 * @param {Array} options.pointColor - The color of the points.
	 * @param {number} options.pointRadius - The pixel radius of the points.
	 */
	constructor(options = {}) {
		super(options);
		this.pointColor = defaultTo(options.pointColor, [ 1.0, 0.0, 1.0, 1.0 ]);
		this.pointRadius = defaultTo(options.pointRadius, 4);
		this.shader = null;
		this.ext = null;
		this.points = null;
	}

	/**
	 * Executed when the overlay is attached to a plot.
	 *
	 * @param {Layer} overlay - The overlay to attach the renderer to.
	 *
	 * @returns {PointOverlayRenderer} The renderer object, for chaining.
	 */
	onAdd(overlay) {
		super.onAdd(overlay);
		this.ext = this.gl.getExtension('OES_standard_derivatives');
		this.shader = this.createShader(SHADER_GLSL);
		return this;
	}

	/**
	 * Executed when the overlay is removed from a plot.
	 *
	 * @param {Layer} overlay - The overlay to remove the renderer from.
	 *
	 * @returns {PointOverlayRenderer} The renderer object, for chaining.
	 */
	onRemove(overlay) {
		this.shader = null;
		this.ext = null;
		this.points = null;
		super.onRemove(overlay);
		return this;
	}

	/**
	 * Generate any underlying buffers.
	 *
	 * @returns {PointOverlayRenderer} The overlay object, for chaining.
	 */
	refreshBuffers() {
		// clip points to only those that are inside the cell
		const clipped = this.overlay.getClippedGeometry();
		// generate the buffer
		if (clipped && clipped.length > 0) {
			this.points = createVertexBuffer(this.gl, clipped);
		} else {
			this.points = null;
		}
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {PointOverlayRenderer} The overlay object, for chaining.
	 */
	draw() {
		if (!this.points) {
			return this;
		}

		const gl = this.gl;
		const shader = this.shader;
		const points = this.points;
		const plot = this.overlay.plot;
		const cell = plot.cell;
		const proj = this.getOrthoMatrix();
		const scale = Math.pow(2, plot.zoom - cell.zoom);
		const opacity = this.overlay.opacity;

		// get view offset in cell space
		const offset = cell.project(plot.viewport, plot.zoom);

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// bind shader
		shader.use();

		// set global uniforms
		shader.setUniform('uProjectionMatrix', proj);
		shader.setUniform('uViewOffset', [ offset.x, offset.y ]);
		shader.setUniform('uScale', scale);
		shader.setUniform('uPointColor', this.pointColor);
		shader.setUniform('uPointRadius', this.pointRadius);
		shader.setUniform('uPixelRatio', plot.pixelRatio);
		shader.setUniform('uOpacity', opacity);

		// draw the points
		points.bind();
		points.draw();

		return this;
	}
}

module.exports = PointOverlayRenderer;
