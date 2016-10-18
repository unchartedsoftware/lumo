'use strict';

const Stats = require('stats.js');
const caleida = require('../src/exports');

const SUBDOMAINS = [
	'a', 'b', 'c',
	'd', 'e', 'f',
	'g', 'h', 'i',
	'j', 'k', 'l',
	'm', 'n', 'o',
	'p', 'q', 'r',
	's', 't', 'u',
	'v', 'w', 'x',
	'y', 'z'
];

const loadImage = function(url, done) {
	let image = new Image();
	image.onload = () => {
		done(null, image);
	};
	image.onerror = (event) => {
		const err = `Unable to load image from URL: \`${event.path[0].currentSrc}\``;
		done(err, null);
	};
	image.crossOrigin = 'anonymous';
	image.src = url;
};

const loadArrayBuffer = function(url, done) {
	const req = new XMLHttpRequest();
	req.open('GET', url, true);
	req.responseType = 'arraybuffer';
	req.onload = () => {
		const arraybuffer = req.response;
		if (arraybuffer) {
			const bytes = new Uint8Array(arraybuffer);
			done(null, bytes);
		} else {
			const err = `Unable to load ArrayBuffer from URL: \`${event.path[0].currentSrc}\``;
			done(err, null);
		}
	};
	req.onerror = (event) => {
		const err = `Unable to load ArrayBuffer from URL: \`${event.path[0].currentSrc}\``;
		done(err, null);
	};
	req.send(null);
};

window.start = function() {

	let plot = new caleida.Plot('#plot', {
		continuousZoom: true,
		inertia: true,
		wraparound: true,
		zoom: 3
	});

	// WebGL Image Texture

	let base = new caleida.Layer({
		renderer: new caleida.TextureRenderer()
	});

	base.requestTile = (coord, done) => {
		const dim = Math.pow(2, coord.z);
		const s = SUBDOMAINS[(coord.x + coord.y + coord.z) % SUBDOMAINS.length];
		const url = `http://${s}.basemaps.cartocdn.com/dark_nolabels/${coord.z}/${coord.x}/${dim - 1 - coord.y}.png`;
		loadImage(url, done);
	};

	plot.addLayer(base);

	// WebGL Buffer Texture

	let mandlebrot = new caleida.Layer({
		renderer: new caleida.TextureRenderer()
	});

	mandlebrot.requestTile = (coord, done) => {
		const url = `mandelbrot/${coord.z}/${coord.x}/${coord.y}`;
		loadArrayBuffer(url, done);
	};

	mandlebrot.opacity = 0.5;

	// plot.addLayer(mandlebrot);

	// WebGL Point

	let point = new caleida.Layer({
		renderer: new caleida.PointRenderer({
			color: [ 0.4, 1.0, 0.1, 0.8 ]
		})
	});

	point.requestTile = (coord, done) => {
		const numPoints = 256 * 2;
		const buffer = new Float32Array(3 * numPoints);
		for (let i=0; i<numPoints; i++) {
			buffer[i*3] = Math.random() * 256; // x
			buffer[i*3+1] = Math.random() * 256; // y
			buffer[i*3+2] = (Math.random() * 4) + 2; // radius
		}
		done(null, buffer);
	};

	plot.addLayer(point);

	// WebGL Shape

	let shape = new caleida.Layer({
		renderer: new caleida.ShapeRenderer()
	});

	shape.requestTile = (coord, done) => {
		const numPoints = 256 * 2;
		const buffer = new Float32Array(3 * numPoints);
		for (let i=0; i<numPoints; i++) {
			buffer[i*3] = Math.random() * 256; // x
			buffer[i*3+1] = Math.random() * 256; // y
			buffer[i*3+2] = (Math.random() * 4) + 2; // radius
		}
		done(null, buffer);
	};

	// plot.addLayer(shape);

	// SVG

	let svgRenderer = new caleida.SVGRenderer();

	svgRenderer.drawTile = function(element) {
		const SVG_NS = 'http://www.w3.org/2000/svg';
		const circle = document.createElementNS(SVG_NS, 'circle');
		circle.setAttribute('cx', 128);
		circle.setAttribute('cy', 128);
		circle.setAttribute('r',  64);
		circle.setAttribute('fill', 'green');
		element.appendChild(circle);
	};

	let svg = new caleida.Layer({
		renderer: svgRenderer
	});

	svg.requestTile = (coord, done) => {
		done(null, {});
	};

	// plot.addLayer(svg);

	// HTML

	let htmlRenderer = new caleida.HTMLRenderer();

	htmlRenderer.drawTile = function(element, tile) {
		const html = document.createElement('div');
		html.style.position = 'absolute';
		html.style.top = '128px';
		html.style.width = '256px';
		html.style['text-align'] = 'center';
		html.style.font = '14px "Helvetica Neue", sans-serif';
		html.innerHTML = `HTML Tile ${tile.coord.hash}`;
		element.appendChild(html);
	};

	let html = new caleida.Layer({
		renderer: htmlRenderer
	});

	html.requestTile = (coord, done) => {
		done(null, {});
	};

	// plot.addLayer(html);

	// Debug performance tracking

	const stats = new Stats();
	document.body.appendChild(stats.dom);
	stats.begin();
	plot.on('frame', () => {
		stats.end();
		stats.begin();
	});
};
