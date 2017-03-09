'use strict';

const polylineNormals = require('polyline-normals');
const defaultTo = require('lodash/defaultTo');
const VertexBuffer = require('../../render/webgl/vertex/VertexBuffer');
const WebGLOverlay = require('./WebGLOverlay');

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
		uniform float uLineWidth;
		uniform float uExtent;
		uniform float uPixelRatio;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uExtent) + (aNormal * uLineWidth * uPixelRatio) + uViewOffset;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
		}
		`,
	frag:
		`
		precision highp float;
		uniform vec4 uLineColor;
		void main() {
			gl_FragColor = vec4(uLineColor.rgb, uLineColor.a);
		}
		`
};

const bufferPolyLine = function(points) {
	const normals = polylineNormals(points);
	const buffer = new Float32Array(points.length * 8);
	for (let i=0; i<points.length; i++) {
		const point = points[i];
		const normal = normals[i][0];
		const magnitude = normals[i][1];
		// left position
		buffer[i*8] = point[0];
		buffer[i*8+1] = point[1];
		// left normal
		buffer[i*8+2] = normal[0] * magnitude;
		buffer[i*8+3] = normal[1] * magnitude;
		// right position
		buffer[i*8+4] = point[0];
		buffer[i*8+5] = point[1];
		// right normal
		buffer[i*8+6] = -normal[0] * magnitude;
		buffer[i*8+7] = -normal[1] * magnitude;
	}
	return buffer;
};

const createVertexBuffer = function(gl, points) {
	const data = bufferPolyLine(points);
	return new VertexBuffer(
		gl,
		data,
		{
			0: {
				size: 2,
				type: 'FLOAT',
				byteOffset: 0
			},
			1: {
				size: 2,
				type: 'FLOAT',
				byteOffset: 2 * 4
			}
		},
		{
			mode: 'TRIANGLE_STRIP',
			count: points.length * 2
		});
};

/**
 * Class representing an overlay.
 */
class WebGLLineOverlay extends WebGLOverlay {

	/**
	 * Instantiates a new WebGLLineOverlay object.
	 */
	constructor(options = {}) {
		super(options);
		this.lineColor = defaultTo(options.lineColor, [ 1.0, 0.0, 1.0, 1.0 ]);
		this.lineWidth = defaultTo(options.lineWidth, 2);
		this.polyLines = new Map();
		this.buffers = new Map();
	}

	/**
	 * Executed when the overlay is attached to a plot.
	 *
	 * @param {Plot} plot - The plot to attach the overlay to.
	 *
	 * @returns {WebGLLineOverlay} The overlay object, for chaining.
	 */
	onAdd(plot) {
		super.onAdd(plot);
		this.shader = this.createShader(SHADER_GLSL);
		this.buffers = new Map();
		if (this.polyLines.size > 0) {
			this.polyLines.forEach((points, id) => {
				const buffer = createVertexBuffer(this.gl, points);
				this.buffers.set(id, buffer);
			});
		}
		return this;
	}

	/**
	 * Executed when the overlay is removed from a plot.
	 *
	 * @param {Plot} plot - The plot to remove the overlay from.
	 *
	 * @returns {WebGLLineOverlay} The overlay object, for chaining.
	 */
	onRemove(plot) {
		super.onAdd(plot);
		this.shader = null;
		this.buffers = new Map();
		return this;
	}

	/**
	 * Add a set of points to render as a single polyline.
	 *
	 * @param {String} id - The id to store the polyline under.
	 * @param {Array} points - The polyline points.
	 *
	 * @returns {WebGLLineOverlay} The overlay object, for chaining.
	 */
	addPolyLine(id, points) {
		this.polyLines.set(id, points);
		if (this.plot) {
			const buffer = createVertexBuffer(this.gl, points);
			this.buffers.push(buffer);
		}
		return this;
	}

	/**
	 * Remove a polyline by id from the overlay.
	 *
	 * @param {String} id - The id to store the polyline under.
	 *
	 * @returns {WebGLLineOverlay} The overlay object, for chaining.
	 */
	removePolyline(id) {
		this.polyLines.delete(id);
		if (this.plot) {
			this.buffers.delete(id);
		}
		return this;
	}

	/**
	 * Remove all polylines from the layer.
	 *
	 */
	clearPolylines() {
		this.polyLines = new Map();
		this.buffers = new Map();
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 *
	 * @returns {WebGLLineOverlay} The overlay object, for chaining.
	 */
	draw() {
		const gl = this.gl;
		const shader = this.shader;
		const buffers = this.buffers;
		const plot = this.plot;
		const proj = this.getOrthoMatrix();
		const extent = Math.pow(2, plot.zoom) * plot.tileSize;
		const offset = [ -plot.viewport.x, -plot.viewport.y ];

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

		// bind shader
		shader.use();

		// set global uniforms
		shader.setUniform('uProjectionMatrix', proj);
		shader.setUniform('uViewOffset', offset);
		shader.setUniform('uLineColor', this.lineColor);
		shader.setUniform('uLineWidth', this.lineWidth / 2);
		shader.setUniform('uExtent', extent);
		shader.setUniform('uPixelRatio', plot.pixelRatio);

		// for each polyline buffer
		buffers.forEach(buffer => {
			// draw the points
			buffer.bind();
			buffer.draw();
		});

		return this;
	}
}

module.exports = WebGLLineOverlay;
