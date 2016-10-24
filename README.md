# lumo

[![npm version](https://badge.fury.io/js/lumo.svg)](http://badge.fury.io/js/lumo)
[![Bower version](https://badge.fury.io/bo/lumo.svg)](http://badge.fury.io/bo/lumo)
[![Build Status](https://travis-ci.org/kbirk/lumo.svg?branch=master)](https://travis-ci.org/kbirk/lumo)
[![Dependency Status](https://david-dm.org/kbirk/lumo.svg)](https://david-dm.org/kbirk/lumo)

A high performance WebGL tile rendering framework.

## Installation

Requires [node](http://nodejs.org/) or [bower](http://bower.io/).

```bash
npm install lumo
```
or
```bash
bower install lumo
```

## Example

```javascript

import lumo from 'lumo';

// Plot

const plot = new lumo.Plot('#plot', {
	continuousZoom: true,
	inertia: true,
	wraparound: true,
	zoom: 3
});

// WebGL Texture Layer

const texture = new lumo.Layer({
	renderer: new lumo.TextureRenderer()
});

texture.requestTile = (coord, done) => {
	const SUBDOMAINS = [ 'a', 'b', 'c', 'd' ];
	const s = SUBDOMAINS[(coord.x + coord.y + coord.z) % SUBDOMAINS.length];
	const url = `http:/${s}.basemaps.cartocdn.com/dark_nolabels/${coord.xyz()}.png`;
	lumo.loadImage(url, done);
};

plot.addLayer(texture);

// WebGL Point Layer

const point = new lumo.Layer({
	renderer: new lumo.PointRenderer({
		color: [ 0.4, 1.0, 0.1, 0.8 ]
	})
});

point.requestTile = (coord, done) => {
	const NUM_POINTS = 256 * 32;
	const buffer = new Float32Array(3 * numPoints);
	for (let i=0; i<numPoints; i++) {
		buffer[i*3] = Math.random() * 256; // x
		buffer[i*3+1] = Math.random() * 256; // y
		buffer[i*3+2] = (Math.random() * 4) + 2; // radius
	}
	done(null, buffer);
};

plot.addLayer(point);
```

## Usage

TODO
