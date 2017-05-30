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
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uScale) - uViewOffset + aNormal * uLineWidth;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
		}
		`,
	frag:
		`
		precision highp float;
		uniform vec4 uLineColor;
		uniform float uOpacity;
		void main() {
			gl_FragColor = vec4(uLineColor.rgb, uLineColor.a * uOpacity);
		}
		`
};

// Private Methods

// NOTE: smooth / round lines implemented using code modified from:
// http://labs.hyperandroid.com/efficient-webgl-stroking . Instead of baking in
// the positions of the lines, this implementation instead generates the
// positions along the line and stores the tangents, allowing the thickness to
// be arbitrarily scaled outwards independant of scale. In order to prevent
// degeneration of normals due to self-intersections, the triangles are
// generated upon zoom.

const EPSILON = 0.000001;

const scalarMult = function(a, s) {
	return {
		x: a.x * s,
		y: a.y * s
	};
};

const perpendicular = function(a) {
	return {
		x: -a.y,
		y: a.x
	};
};

const invert = function(a) {
	return {
		x: -a.x,
		y: -a.y
	};
};

const length = function(a) {
	return Math.sqrt(a.x * a.x + a.y * a.y);
};

const normalize = function(a) {
	const mod = Math.sqrt(a.x * a.x + a.y * a.y);
	return {
		x: a.x / mod,
		y: a.y / mod
	};
};

const add = function(p0, p1) {
	return {
		x: p0.x + p1.x,
		y: p0.y + p1.y
	};
};

const sub = function(p0, p1) {
	return {
		x: p0.x - p1.x,
		y: p0.y - p1.y
	};
};

const middle = function(p0, p1) {
	return scalarMult(add(p0, p1), 0.5);
};

const equal = function(p0, p1) {
	return p0.x === p1.x && p0.y === p1.y;
};

const signedArea = function(p0, p1, p2) {
	return (p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y);
};

const getStrokeGeometry = function(points, strokeWidth) {
	if (points.length < 2) {
		throw 'A valid polyline must consist of at least 2 points';
	}

	const lineWidth = strokeWidth / 2;
	const positions = [];
	const normals = [];
	const middlePoints = []; // middle points per each line segment
	let closed = false;

	if (points.length === 2) {

		createTriangles(
			points[0],
			middle(points[0], points[1]),
			points[1],
			positions,
			normals,
			lineWidth);

	} else {

		if (equal(points[0], points[points.length - 1])) {
			const p0 = middle(points.shift(), points[0]);
			points.unshift(p0);
			points.push(p0);
			closed = true;
		}

		for (let i=0; i<points.length-1; i++) {
			if (i === 0) {
				middlePoints.push(points[0]);
			} else if (i === points.length - 2) {
				middlePoints.push(points[points.length - 1]);
			} else {
				middlePoints.push(middle(points[i], points[i + 1]));
			}
		}

		for (let i=1; i<middlePoints.length; i++) {
			createTriangles(
				middlePoints[i - 1],
				points[i],
				middlePoints[i],
				positions,
				normals,
				lineWidth);
		}
	}

	if (!closed) {

		// start cap
		let p0 = points[0];
		let p1 = points[1];
		let t = perpendicular(sub(p1, p0));
		createRoundCap(
			p0,
			add(p0, t),
			sub(p0, t),
			p1,
			positions,
			normals);

		// end cap
		p0 = points[points.length - 1];
		p1 = points[points.length - 2];
		t = perpendicular(sub(p1, p0));
		createRoundCap(
			p0,
			add(p0, t),
			sub(p0, t),
			p1,
			positions,
			normals);
	}

	return {
		positions: positions,
		normals: normals
	};
};

const createRoundCap = function(center, p0, p1, nextPointInLine, positions, normals) {

	let angle0 = Math.atan2((p1.y - center.y), (p1.x - center.x));
	let angle1 = Math.atan2((p0.y - center.y), (p0.x - center.x));

	const orgAngle0 = angle0;

	if (angle1 > angle0) {
		if (angle1 - angle0 >= Math.PI - EPSILON) {
			angle1 = angle1 - (2 * Math.PI);
		}
	} else {
		if (angle0 - angle1 >= Math.PI - EPSILON) {
			angle0 = angle0 - (2 * Math.PI);
		}
	}

	let angleDiff = angle1 - angle0;

	if (Math.abs(angleDiff) >= (Math.PI - EPSILON) &&
		Math.abs(angleDiff) <= (Math.PI + EPSILON)) {
		const r1 = sub(center, nextPointInLine);
		if (r1.x === 0) {
			if (r1.y > 0) {
				angleDiff = -angleDiff;
			}
		} else if (r1.x >= -EPSILON) {
			angleDiff = -angleDiff;
		}
	}

	const segmentsPerSemi = 16;
	const nsegments = Math.ceil(Math.abs(angleDiff / Math.PI) * segmentsPerSemi);

	const angleInc = angleDiff / nsegments;
	const n0 = {
		x: 0,
		y: 0
	};

	for (let i=0; i<nsegments; i++) {
		const n1 = {
			x: Math.cos(orgAngle0 + angleInc * i),
			y: Math.sin(orgAngle0 + angleInc * i)
		};
		const n2 = {
			x: Math.cos(orgAngle0 + angleInc * (1 + i)),
			y: Math.sin(orgAngle0 + angleInc * (1 + i))
		};
		positions.push(center);
		positions.push(center);
		positions.push(center);
		normals.push(n0);
		normals.push(n1);
		normals.push(n2);
	}
};

function lineIntersection(p0, p1, p2, p3) {
	const a0 = p1.y - p0.y;
	const b0 = p0.x - p1.x;
	const a1 = p3.y - p2.y;
	const b1 = p2.x - p3.x;
	const det = a0 * b1 - a1 * b0;
	if (det > -EPSILON && det < EPSILON) {
		return null;
	}
	const c0 = a0 * p0.x + b0 * p0.y;
	const c1 = a1 * p2.x + b1 * p2.y;
	const x = (b1 * c0 - b0 * c1) / det;
	const y = (a0 * c1 - a1 * c0) / det;
	return {
		x: x,
		y: y
	};
}

function createTriangles(p0, p1, p2, positions, normals, lineWidth) {
	let t0 = sub(p1, p0);
	let t2 = sub(p2, p1);

	t0 = perpendicular(t0);
	t2 = perpendicular(t2);

	// triangle composed by the 3 points if clockwise or counter-clockwise.
	// if counter-clockwise, we must invert the line threshold points, otherwise
	// the intersection point could be erroneous and lead to odd results.
	if (signedArea(p0, p1, p2) > 0) {
		t0 = invert(t0);
		t2 = invert(t2);
	}

	t0 = normalize(t0);
	t2 = normalize(t2);
	t0 = scalarMult(t0, lineWidth);
	t2 = scalarMult(t2, lineWidth);

	const pintersect = lineIntersection(
		add(t0, p0),
		add(t0, p1),
		add(t2, p2),
		add(t2, p1));

	let anchor = null;
	let anchorLength = Number.MAX_VALUE;
	let ian = null;
	if (pintersect) {
		anchor = sub(pintersect, p1);
		anchorLength = length(anchor);
		ian = invert(scalarMult(anchor, 1.0 / lineWidth));
	}
	const p0p1 = sub(p0, p1);
	const p0p1Length = length(p0p1);
	const p1p2 = sub(p1, p2);
	const p1p2Length = length(p1p2);

	const n0 = normalize(t0);
	const in0 = invert(n0);
	const n2 = normalize(t2);
	const in2 = invert(n2);

	// the cross point exceeds any of the segments dimension.
	// do not use cross point as reference.
	if (anchorLength > p0p1Length || anchorLength > p1p2Length) {

		positions.push(p0);
		positions.push(p0);
		positions.push(p1);

		normals.push(n0);
		normals.push(in0);
		normals.push(n0);

		positions.push(p0);
		positions.push(p1);
		positions.push(p1);

		normals.push(in0);
		normals.push(n0);
		normals.push(in0);

		createRoundCap(
			p1,
			add(p1, t0),
			add(p1, t2),
			p2,
			positions,
			normals);

		positions.push(p2);
		positions.push(p1);
		positions.push(p1);

		normals.push(n2);
		normals.push(in2);
		normals.push(n2);

		positions.push(p2);
		positions.push(p1);
		positions.push(p2);

		normals.push(n2);
		normals.push(in2);
		normals.push(in2);

	} else {

		positions.push(p0);
		positions.push(p0);
		positions.push(p1);

		normals.push(n0);
		normals.push(in0);
		normals.push(ian);

		positions.push(p0);
		positions.push(p1);
		positions.push(p1);

		normals.push(n0);
		normals.push(ian);
		normals.push(n0);

		positions.push(p1);
		positions.push(p1);
		positions.push(p1);

		normals.push(n0);
		normals.push({ x: 0, y: 0 });
		normals.push(ian);

		createRoundCap(
			p1,
			add(p1, t0),
			add(p1, t2),
			sub(p1, anchor),
			positions,
			normals);

		positions.push(p1);
		positions.push(p1);
		positions.push(p1);

		normals.push({ x: 0, y: 0 });
		normals.push(n2);
		normals.push(ian);

		positions.push(p2);
		positions.push(p1);
		positions.push(p1);

		normals.push(n2);
		normals.push(ian);
		normals.push(n2);

		positions.push(p2);
		positions.push(p1);
		positions.push(p2);

		normals.push(n2);
		normals.push(ian);
		normals.push(in2);
	}
}

const bufferPolyline = function(points, normals) {
	const buffer = new Float32Array(points.length * 4);
	for (let i=0; i<points.length; i++) {
		const point = points[i];
		const normal = normals[i];
		buffer[i*4] = point.x;
		buffer[i*4+1] = point.y;
		buffer[i*4+2] = normal.x;
		buffer[i*4+3] = normal.y;
	}
	return buffer;
};

const createVertexBuffer = function(overlay, points) {
	const lineWidth = overlay.lineWidth;
	const geometry = getStrokeGeometry(points, lineWidth);
	const data = bufferPolyline(geometry.positions, geometry.normals);
	return new VertexBuffer(
		overlay.gl,
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
			mode: 'TRIANGLES',
			count: geometry.positions.length
		});
};

/**
 * Class representing a webgl polyline overlay renderer.
 */
class LineOverlayRenderer extends WebGLOverlayRenderer {

	/**
	 * Instantiates a new LineOverlayRenderer object.
	 *
	 * @param {Object} options - The overlay options.
	 * @param {Array} options.lineColor - The color of the line.
	 * @param {number} options.lineWidth - The pixel width of the line.
	 */
	constructor(options = {}) {
		super(options);
		this.lineColor = defaultTo(options.lineColor, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.lineWidth = defaultTo(options.lineWidth, 2);
		this.shader = null;
		this.lines = null;
	}

	/**
	 * Executed when the overlay is attached to a plot.
	 *
	 * @param {Plot} plot - The plot to attach the overlay to.
	 *
	 * @returns {LineOverlayRenderer} The overlay object, for chaining.
	 */
	onAdd(plot) {
		super.onAdd(plot);
		this.shader = this.createShader(SHADER_GLSL);
		return this;
	}

	/**
	 * Executed when the overlay is removed from a plot.
	 *
	 * @param {Plot} plot - The plot to remove the overlay from.
	 *
	 * @returns {LineOverlayRenderer} The overlay object, for chaining.
	 */
	onRemove(plot) {
		super.onRemove(plot);
		this.shader = null;
		return this;
	}

	/**
	 * Generate any underlying buffers.
	 *
	 * @returns {LineOverlayRenderer} The overlay object, for chaining.
	 */
	refreshBuffers() {
		const clipped = this.overlay.getClippedGeometry();
		if (clipped) {
			this.lines = clipped.map(points => {
				// generate the buffer
				return createVertexBuffer(this, points);
			});
		} else {
			this.lines = null;
		}
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {LineOverlayRenderer} The overlay object, for chaining.
	 */
	draw() {
		if (!this.lines) {
			return this;
		}

		const gl = this.gl;
		const shader = this.shader;
		const lines = this.lines;
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
		shader.setUniform('uLineWidth', this.lineWidth / 2);
		shader.setUniform('uLineColor', this.lineColor);
		shader.setUniform('uOpacity', opacity);

		// for each polyline buffer
		lines.forEach(buffer => {
			// draw the points
			buffer.bind();
			buffer.draw();
		});

		return this;
	}
}

module.exports = LineOverlayRenderer;
