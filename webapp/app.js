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

window.start = function() {

	const plot = new caleida.Plot('#plot', {
		continuousZoom: false,
		inertia: true,
		wraparound: false,
		zoom: 0
	});

	// WebGL Image Texture

	const base = new caleida.Layer({
		renderer: new caleida.TextureRenderer()
	});
	base.requestTile = (coord, done) => {
		const s = SUBDOMAINS[(coord.x + coord.y + coord.z) % SUBDOMAINS.length];
		const url = `http://${s}.basemaps.cartocdn.com/dark_nolabels/${coord.xyz()}.png`;
		caleida.loadImage(url, done);
	};
	base.on('tile:load', () => {
		console.log('LOADED!');
	});
	plot.addLayer(base);

	// WebGL Buffer Texture

	const mandlebrot = new caleida.Layer({
		renderer: new caleida.TextureRenderer()
	});
	mandlebrot.opacity = 0.5;
	mandlebrot.requestTile = (coord, done) => {
		const url = `mandelbrot/${coord.tms()}`;
		caleida.loadBuffer(url, (err, buffer) => {
			if (err) {
				done(err);
				return;
			}
			done(null, new Uint8Array(buffer));
		});
	};
	// plot.addLayer(mandlebrot);

	// WebGL Point

	const point = new caleida.Layer({
		renderer: new caleida.PointRenderer({
			color: [ 0.4, 1.0, 0.1, 0.8 ]
		})
	});
	point.requestTile = (coord, done) => {
		const numPoints = 256 * 16;
		const buffer = new Float32Array(3 * numPoints);
		for (let i=0; i<numPoints; i++) {
			buffer[i*3] = Math.random() * 256; // x
			buffer[i*3+1] = Math.random() * 256; // y
			buffer[i*3+2] = (Math.random() * 2) + 1; // radius
		}
		done(null, buffer);
	};
	//plot.addLayer(point);

	setInterval(()=> {
		point.opacity = 0.2 + Math.sin(Date.now() / 200);
	}, 10);

	// WebGL Interactive Point

	const interactive = new caleida.Layer({
		renderer: new caleida.InteractiveRenderer()
	});
	interactive.requestTile = (coord, done) => {
		const numPoints = 256;
		const points = new Array(numPoints);
		for (let i=0; i<numPoints; i++) {
			points[i] = {
				x: Math.random() * 256, // x
				y: Math.random() * 256, // y
				radius: (Math.random() * 8) + 4 // radius
			};
		}
		done(null, points);
	};
	//plot.addLayer(interactive);

	// WebGL Shape

	const shape = new caleida.Layer({
		renderer: new caleida.ShapeRenderer({
			color: [ 0.2, 0.2, 0.8, 0.8 ]
		})
	});
	shape.requestTile = (coord, done) => {
		const numPoints = 64;
		const buffer = new Float32Array(numPoints * 3);
		for (let i=0; i<numPoints; i++) {
			buffer[i*3] = Math.random() * 256; // x
			buffer[i*3+1] = Math.random() * 256; // y
			buffer[i*3+2] = (Math.random() * 16) + 16; // radius
		}
		done(null, buffer);
	};
	//plot.addLayer(shape);

	setInterval(()=> {
		shape.opacity = 0.2 + Math.cos(Date.now() / 200);
	}, 20);

	// SVG

	const svgRenderer = new caleida.SVGRenderer();
	svgRenderer.drawTile = function(element) {
		const SVG_NS = 'http://www.w3.org/2000/svg';
		const circle = document.createElementNS(SVG_NS, 'circle');
		circle.setAttribute('cx', 128);
		circle.setAttribute('cy', 128);
		circle.setAttribute('r',  64);
		circle.setAttribute('fill', 'green');
		element.appendChild(circle);
	};
	const svg = new caleida.Layer({
		renderer: svgRenderer
	});
	svg.requestTile = (coord, done) => {
		done(null, {});
	};
	// plot.addLayer(svg);

	// HTML

	const htmlRenderer = new caleida.HTMLRenderer();
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
	const html = new caleida.Layer({
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
