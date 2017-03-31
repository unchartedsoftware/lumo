'use strict';

const defaultTo = require('lodash/defaultTo');
const VertexBuffer = require('../../render/webgl/vertex/VertexBuffer');
const Bounds = require('../../core/Bounds');
const EventType = require('../../event/EventType');
const WebGLOverlay = require('./WebGLOverlay');

// Constants

/**
 * Pan event handler symbol.
 * @constant {Symbol}
 */
const PAN = Symbol();

/**
 * Zoom event handler symbol.
 * @constant {Symbol}
 */
const ZOOM = Symbol();

/**
 * The size of the cell.
 * @constant {Number}
 */
const CELL_SIZE = Math.pow(2, 16);

/**
 * The size of the cell regeneration buffer, will regenerate the cell if you are
 * within this many pixels to it's bounds.
 * @constant {Number}
 */
const CELL_BUFFER = Math.pow(2, 8);

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
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uScale) - uViewOffset + aNormal * uLineWidth * uPixelRatio;
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
// the positions of the lines, this implementation instead generates the points
// along the middle of the line and stores the tangents as normals, allowing
// the thickness to be arbtrarily scaled outwards independant of scale.
// In order to prevent degeneration of normals due to self-intersections, the
// triangles are generated upon zoom.

const EPSILON = 0.000001;

const scalarMult = function(a, s) {
	return [
		a[0] * s,
		a[1] * s
	];
};

const perpendicular = function(a) {
	return [
		-a[1],
		a[0]
	];
};

const invert = function(a) {
	return [
		-a[0],
		-a[1]
	];
};

const length = function(a) {
	return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
};

const normalize = function(a) {
	const mod = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
	return [
		a[0] / mod,
		a[1] / mod
	];
};

const add = function(p0, p1) {
	return [
		p0[0] + p1[0],
		p0[1] + p1[1]
	];
};

const sub = function(p0, p1) {
	return [
		p0[0] - p1[0],
		p0[1] - p1[1]
	];
};

const middle = function(p0, p1) {
	return scalarMult(add(p0, p1), 0.5);
};

const equal = function(p0, p1) {
	return p0[0] === p1[0] && p0[1] === p1[1];
};

const signedArea = function(p0, p1, p2) {
	return (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1]);
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

	let angle0 = Math.atan2((p1[1] - center[1]), (p1[0] - center[0]));
	let angle1 = Math.atan2((p0[1] - center[1]), (p0[0] - center[0]));

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
		if (r1[0] === 0) {
			if (r1[1] > 0) {
				angleDiff = -angleDiff;
			}
		} else if (r1[0] >= -EPSILON) {
			angleDiff = -angleDiff;
		}
	}

	const segmentsPerSemi = 16;
	const nsegments = Math.ceil(Math.abs(angleDiff / Math.PI) * segmentsPerSemi);

	const angleInc = angleDiff / nsegments;
	const n0 = [ 0, 0 ];

	for (let i=0; i<nsegments; i++) {
		const n1 = [
			Math.cos(orgAngle0 + angleInc * i),
			Math.sin(orgAngle0 + angleInc * i)
		];
		const n2 = [
			Math.cos(orgAngle0 + angleInc * (1 + i)),
			Math.sin(orgAngle0 + angleInc * (1 + i))
		];
		positions.push(center);
		positions.push(center);
		positions.push(center);
		normals.push(n0);
		normals.push(n1);
		normals.push(n2);
	}
};

function lineIntersection(p0, p1, p2, p3) {
	const a0 = p1[1] - p0[1];
	const b0 = p0[0] - p1[0];
	const a1 = p3[1] - p2[1];
	const b1 = p2[0] - p3[0];
	const det = a0 * b1 - a1 * b0;
	if (det > -EPSILON && det < EPSILON) {
		return null;
	}
	const c0 = a0 * p0[0] + b0 * p0[1];
	const c1 = a1 * p2[0] + b1 * p2[1];
	const x = (b1 * c0 - b0 * c1) / det;
	const y = (a0 * c1 - a1 * c0) / det;
	return [ x, y ];
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
		normals.push([ 0, 0 ]);
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

		normals.push([ 0, 0 ]);
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
		buffer[i*4] = point[0];
		buffer[i*4+1] = point[1];
		buffer[i*4+2] = normal[0];
		buffer[i*4+3] = normal[1];
	}
	return buffer;
};

const createVertexBuffer = function(overlay, points) {
	const lineWidth = overlay.lineWidth * overlay.plot.pixelRatio;
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

const normalizePoint = function(pos, cell) {
	// convert point into cell pixel space
	return [
		((pos.x * cell.scale) - cell.offsetPx.x),
		((pos.y * cell.scale) - cell.offsetPx.y)
	];
};

const clipPolylines = function(bounds, polylines, cell) {
	const clipped = [];
	polylines.forEach(polyline => {
		let current = [];
		for (let i=1; i<polyline.length; i++) {
			const a = polyline[i-1];
			const b = polyline[i];
			// clip the line
			const line = bounds.clipLine(
				{ x: a[0], y: a[1] },
				{ x: b[0], y: b[1] }
			);
			// no line in bounds
			if (!line) {
				continue;
			}
			// add src point
			current.push(normalizePoint(line.a, cell));
			if (line.b.clipped || i === polyline.length - 1) {
				// only add destination point if it was clipped, or is last point
				current.push(normalizePoint(line.b, cell));
				// then break the polyline
				clipped.push(current);
				current = [];
			}
		}
		if (current.length > 0) {
			// add last polyline
			clipped.push(current);
		}
	});
	return clipped;
};

const getCell = function(plot) {
	const zoom = Math.round(plot.getTargetZoom());
	const scale = Math.pow(2, zoom) * plot.tileSize;
	const centerPx = plot.getTargetCenter();
	const center = {
		x: centerPx.x / scale,
		y: centerPx.y / scale
	};
	const offsetPx = {
		x: centerPx.x - (CELL_SIZE / 2),
		y: centerPx.y - (CELL_SIZE / 2)
	};
	return {
		zoom: zoom,
		halfSize: (CELL_SIZE / 2) / scale,
		buffer: CELL_BUFFER / scale,
		center: center,
		offsetPx: offsetPx,
		scale: scale
	};
};

const generatePolylines = function(overlay, cell) {
	// determine our cell bounds
	const bounds = new Bounds(
		cell.center.x - cell.halfSize,
		cell.center.x + cell.halfSize,
		cell.center.y - cell.halfSize,
		cell.center.y + cell.halfSize);
	// clear the buffers
	overlay.buffers = [];
	// trim polylines to only those that are intersect the cell
	const polylines = clipPolylines(bounds, overlay.polylines, cell);
	// generate the buffers
	polylines.forEach(points => {
		overlay.buffers.push(createVertexBuffer(overlay, points));
	});
	// store cell generation stats
	overlay.cell = cell;
};

const regeneratePolylines = function(overlay, force) {
	// get cell parameters
	const cell = getCell(overlay.plot);

	// check if a cell exists
	if (force || !overlay.cell) {
		// generate polylines
		generatePolylines(overlay, cell);
		return;
	}

	// check if we are outside of one zoom level from last
	const zoomDist = Math.abs(overlay.cell.zoom - cell.zoom);
	if (zoomDist >= 1) {
		// generate polylines
		generatePolylines(overlay, cell);
		return;
	}

	// check if we are withing buffer distance of the cell bounds
	if (Math.abs(cell.center.x - overlay.cell.center.x) > (overlay.cell.halfSize - overlay.cell.buffer) ||
		Math.abs(cell.center.y - overlay.cell.center.y) > (overlay.cell.halfSize - overlay.cell.buffer)) {
		// generate polylines
		generatePolylines(overlay, cell);
		return;
	}
};

/**
 * Class representing a webgl polyline overlay.
 */
class WebGLLineOverlay extends WebGLOverlay {

	/**
	 * Instantiates a new WebGLLineOverlay object.
	 */
	constructor(options = {}) {
		super(options);
		this.lineColor = defaultTo(options.lineColor, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.lineWidth = defaultTo(options.lineWidth, 8);
		this.polylines = new Map();
		this.buffers = null;
		this.shader = null;
		this.cell = null;
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
		// generate the polylines
		regeneratePolylines(this, true);
		// create regeneration handlers
		const pan = () => {
			// attempt to regenerate the polylines
			regeneratePolylines(this);
		};
		const zoom = () => {
			// attempt to regenerate the polylines
			regeneratePolylines(this);
		};
		this.handlers.set(PAN, pan);
		this.handlers.set(ZOOM, zoom);
		this.plot.on(EventType.PAN, pan);
		this.plot.on(EventType.ZOOM, zoom);
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
		this.plot.removeListener(EventType.PAN, this.handlers.get(PAN));
		this.plot.removeListener(EventType.ZOOM, this.handlers.get(ZOOM));
		this.handlers.delete(PAN);
		this.handlers.delete(ZOOM);
		this.shader = null;
		this.buffers = null;
		this.cell = null;
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
	addPolyline(id, points) {
		this.polylines.set(id, points);
		if (this.plot) {
			// regenerate the polylines
			regeneratePolylines(this, true);
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
		this.polylines.delete(id);
		if (this.plot) {
			// regenerate the polylines
			regeneratePolylines(this, true);
		}
		return this;
	}

	/**
	 * Remove all polylines from the layer.
	 *
	 * @returns {WebGLLineOverlay} The overlay object, for chaining.
	 */
	clearPolylines() {
		this.polylines = new Map();
		if (this.plot) {
			this.buffers = null;
		}
		return this;
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @param {Number} timestamp - The frame timestamp.
	 *
	 * @returns {WebGLLineOverlay} The overlay object, for chaining.
	 */
	draw() {
		if (!this.cell) {
			console.log('no cell');
			return;
		}

		const gl = this.gl;
		const shader = this.shader;
		const buffers = this.buffers;
		const plot = this.plot;
		const cell = this.cell;
		const proj = this.getOrthoMatrix();
		const scale = Math.pow(2, plot.zoom - cell.zoom);

		// get view offset relative to cell offset
		const offset = [
			plot.viewport.x - (cell.offsetPx.x * scale),
			plot.viewport.y - (cell.offsetPx.y * scale)
		];

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// bind shader
		shader.use();

		// set global uniforms
		shader.setUniform('uProjectionMatrix', proj);
		shader.setUniform('uViewOffset', offset);
		shader.setUniform('uScale', scale);
		shader.setUniform('uPixelRatio', plot.pixelRatio);
		shader.setUniform('uLineWidth', this.lineWidth / 2);
		shader.setUniform('uLineColor', this.lineColor);
		shader.setUniform('uOpacity', this.opacity);

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
