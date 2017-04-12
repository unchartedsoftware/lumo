<img width="600" src="https://rawgit.com/unchartedsoftware/lumo/master/logo.svg" alt="lumo" />

> A high performance WebGL tile rendering library

[![npm version](https://badge.fury.io/js/lumo.svg)](http://badge.fury.io/js/lumo)
[![Bower version](https://badge.fury.io/bo/lumo.svg)](http://badge.fury.io/bo/lumo)
[![Build Status](https://travis-ci.org/unchartedsoftware/lumo.svg?branch=master)](https://travis-ci.org/unchartedsoftware/lumo)
[![Dependency Status](https://david-dm.org/unchartedsoftware/lumo/status.svg)](https://david-dm.org/unchartedsoftware/lumo)

## Introduction

Lumo is a lightweight rendering library designed for highly scalable, customizable, and performant WebGL tile-based visualizations. Lumo is composed of simple and extensible interfaces for retrieving, managing, and rendering tile-based data.

While Lumo does provide some high-level data abstractions for WebGL, it assumes a degree of familiarity with the WebGL API and GLSL.

**Note:** The library is currently a work-in-progress and the interfaces are likely to change.

## Installation

Lumo can be installed via [node](http://nodejs.org/) or [bower](http://bower.io/).

```bash
npm install lumo
```

or
```bash
bower install lumo
```

Lumo is written in ES6 and requires a 6.x+ distribution of [node](http://nodejs.org/). The `lumo.js` and `lumo.min.js` build files have been transpiled via [babeljs](https://babeljs.io/) using the [es2015 preset](https://babeljs.io/docs/plugins/preset-es2015/) and should be consumable by most modern browsers.

## Example

The following is a simple application that creates a single `lumo.Plot` and attaches two `lumo.Layer` objects. The first layer `base` retrieves [CARTO Basemap tiles](https://carto.com/location-data-services/basemaps/) and renders them using the `lumo.TextureRenderer`. The `points` layer generates random points of varying radius and renders them with the `lumo.PointRenderer`.

* [JSFiddle Example](https://jsfiddle.net/gwn9tua0/)

```javascript

import lumo from 'lumo';

// Plot

const plot = new lumo.Plot('#plot', {
	continuousZoom: true,
	inertia: true,
	wraparound: true,
	zoom: 3
});

// WebGL Texture Base Layer

const base = new lumo.Layer({
	renderer: new lumo.TextureRenderer()
});

base.requestTile = (coord, done) => {
	const SUBDOMAINS = [ 'a', 'b', 'c', 'd' ];
	const s = SUBDOMAINS[(coord.x + coord.y + coord.z) % SUBDOMAINS.length];
	const url = `http:/${s}.basemaps.cartocdn.com/dark_nolabels/${coord.xyz()}.png`;
	lumo.loadImage(url, done);
};

plot.add(base);

// WebGL Point Layer

const points = new lumo.Layer({
	renderer: new lumo.PointRenderer({
		color: [ 0.4, 1.0, 0.1, 0.8 ]
	})
});

points.requestTile = (coord, done) => {
	const NUM_POINTS = 256 * 32;
	const buffer = new Float32Array(3 * NUM_POINTS);
	for (let i=0; i<NUM_POINTS; i++) {
		buffer[i*3] = Math.random() * 256; // x
		buffer[i*3+1] = Math.random() * 256; // y
		buffer[i*3+2] = (Math.random() * 4) + 2; // radius
	}
	done(null, buffer);
};

plot.add(points);
```

## Usage

### Plot

The central component tying all tile based visualizations together is a plot. A plot is instantiated by providing a selector string for a containing DOM element, along with an optional configuration object.

```javascript
const plot = new lumo.Plot('#plot', {
	continuousZoom: true,
	inertia: true,
	wraparound: true,
	zoom: 3
});
```

### Layer

A layer represents a single source of tile data. A layer is only responsible for retrieving and storing tile data in it's retrieved format.

```javascript
const layer = new lumo.Layer();

layer.requestTile = (coord, done) => {
	done(null, {});
};

plot.add(layer)
```

### Renderer

A renderer is attached to a layer and is responsible for storing the data on the GPU and subsequently rendering the data to the plot.

```javascript
const renderer = new lumo.PointRenderer();
layer.setRenderer(renderer);
```

The base `lumo.Renderer` class provides a simple and unstructured class for rendering layer data.

The `lumo.WebGLRenderer` class implements a more refined class specific to custom WebGL renderings. This is iterated upon further with the `lumo.WebGLVertexRenderer` and `lumo.WebGLTextureRenderer` which provide high-level abstractions for efficiently storing and accessing tile data on the GPU.

Lumo provides four sample renderers to act as guides for creating your own:

- **TextureRenderer** renders texture-based data at varying levels of detail. It assumes data is retrieved as a Uint8Array of RGBA values. Tiles that do not currently have tile data are rendered using the highest available level of detail.

- **PointRenderer** renders vertex-based data of varying x, y, and radius. It assumes data is retrieved as a Float32Array with interleaved vertices in the format [x, y, radius, x, y, radius, ...].

- **ShapeRenderer** renders instanced shapes (stars in this implementation) for vertex-based data of varying x, y, and radius. It assumes data is retrieved as a Float32Array with interleaved vertices in the format [x, y, radius, x, y, radius, ...].

- **InteractiveRenderer** renders vertex-based data of varying x, y, and radius. It assumes data is retrieved as an array of objects of the format { x: , y:, radius: }, however the exact field names are configurable. This renderer implements the `lumo.WebGLInteractiveRenderer` which provides interfaces for spatially indexing point data and emitting `click`, `mouseover`, and `mouseout` events.

Below is an example of a minimalistic vertex-based renderer implemented by extending the `lemo.WebGLVertexRenderer` class:

```javascript
class SampleRenderer extends WebGLVertexRenderer {
	constructor(options = {}) {
		super(options);
		this.shader = null;
		this.atlas = null;
	}
	onAdd(layer) {
		super.onAdd(layer);
		this.shader = this.createShader({
			vert:
				`
				precision highp float;
				attribute vec2 aPosition;
				uniform vec2 uTileOffset;
				uniform float uScale;
				uniform mat4 uProjection;
				void main() {
					vec2 wPosition = (aPosition * uScale) + uTileOffset;
					gl_PointSize = 4.0;
					gl_Position = uProjection * vec4(wPosition, 0.0, 1.0);
				}
				`,
			frag:
				`
				precision highp float;
				void main() {
					gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
				}
				`
		});
		this.atlas = this.createVertexAtlas({
			0: {
				size: 2,
				type: 'FLOAT'
			}
		});
		return this;
	}
	onRemove(layer) {
		this.destroyVertexAtlas(this.atlas);
		this.atlas = null;
		this.shader = null;
		super.onRemove(layer);
		return this;
	}
	draw() {
		// use shader
		this.shader.use();
		// set projection
		this.shader.setUniform('uProjectionMatrix', this.getOrthoMatrix());
		// binds the vertex atlas
		this.atlas.bind();
		// for each renderable tile
		this.getRenderables().forEach(renderable => {
			// set tile uniforms
			this.shader.setUniform('uScale', renderable.scale);
			this.shader.setUniform('uTileOffset', renderable.tileOffset);
			// draw the points
			this.atlas.draw(renderable.hash, 'POINTS');
		});
		// unbind the vertex atlas
		this.atlas.unbind();
		return this;
	}
}
```

### Overlay

An overlay represents a single source of data. The data is not tiled and is added / removed in a global sense. An overlay is responsible for storing and rendering it's data.

```javascript
const overlay = new lumo.WebGLLineOverlay();

overlay.addPolyline('line-id', [
	{ x: 0.2, y: 0.2 },
	{ x: 0.8, y: 0.8 },
	{ x: 0.2, y: 0.8 },
	{ x: 0.8, y: 0.2 },
	{ x: 0.2, y: 0.2 }
]);

plot.add(overlay)
```

### Coordinates

There are three coordinate systems used by Lumo. Tile coordinates, plot coordinates and viewport coordinates. All coordinates have the origin [0, 0] as the bottom-left.

- **Tile Coordinates** have three components and follow the TMS specification in the format of {z, x, y}. Each zoom level increases the number of tiles in each dimension by a power of two. These coordinates are used to request and store tiles.

- **Tile Pixel Coordinates** have two components and are the pixel coordinates relative to the bottom-left corner of the respective tile. These coordinates are used to render the tile data.

- **Plot Coordinates** have two components, [0, 0] at the bottom-left corner of the plot, and [1, 1] at the top-right.

### Events

All `lumo.Plot`, `lumo.Layer`, `lumo.Overlay`, and `lumo.Renderer` classes extend the `EventEmitter` class and are capable of emitting events.

The following events are emitted by Lumo:

#### Plot

- **Mouse**
	- **click**: Emitted when the plot is clicked.
	- **dblclick**: Emitted when the plot is double clicked.
	- **mousemove**: Emitted when the mouse is moved over the plot.
	- **mousedown**: Emitted when the mouse button is pressed over the plot.
	- **mouseup**: Emitted when the mouse button is released over the plot.
	- **mouseover**: Emitted when the mouse is moved over the plot.
	- **mouseout**: Emitted when the mouse is moved outside of the plot.
- **Pan / Zoom**
	- **zoomstart**: Emitted when a new zoom event is handled.
	- **zoom**: Emitted during each frame of a zoom animation.
	- **zoomend**: Emitted when a zoom event is complete.
	- **panstart**: Emitted when a new pan event is handled.
	- **pan**: Emitted during each frame of a pan animation.
	- **panend**: Emitted when a pan event is complete.
- **Resize**
	- **resize**: Emitted whenever the plot dimensions change.
- **Frame**
	- **frame**: Emitted at the beginning of every render frame.

#### Layer

- **Mouse**
	- **click**: Emitted when an element of the layer is clicked.
	- **dblclick**: Emitted when an element of the layer is double clicked.
	- **mousemove**: Emitted when the mouse is moved over an element of the layer.
	- **mousedown**: Emitted when the mouse button is pressed over an element of the layer.
	- **mouseup**: Emitted when the mouse button is released over an element of the layer.
	- **mouseover**: Emitted when the mouse is moved over an element of the layer.
	- **mouseout**: Emitted when the mouse is moved outside of an element of the layer.
- **Tile**
	- **tilerequest**: Emitted when a tile is requested for the layer.
	- **tileadd**: Emitted when a tile is received and added to the layer.
	- **tilefailure**: Emitted when a tile request fails and the tile is rejected.
	- **tilediscard**: Emitted when a tile is received but is deemed stale and discarded.
	- **tileremove**: Emitted when a tile is evicted from the layer.
	- **load**: Emitted when a all pending tiles have loaded for the layer.
- **Pan / Zoom**
	- **zoomstart**: Emitted when a new zoom event is handled.
	- **zoom**: Emitted during each frame of a zoom animation.
	- **zoomend**: Emitted when a zoom event is complete.
	- **panstart**: Emitted when a new pan event is handled.
	- **pan**: Emitted during each frame of a pan animation.
	- **panend**: Emitted when a pan event is complete.

#### Overlay
- **Mouse**
	- **click**: Emitted when an element of the overlay is clicked.
	- **dblclick**: Emitted when an element of the overlay is double clicked.
	- **mousemove**: Emitted when the mouse is moved over an element of the overlay.
	- **mousedown**: Emitted when the mouse button is pressed over an element of the overlay.
	- **mouseup**: Emitted when the mouse button is released over an element of the overlay.
	- **mouseover**: Emitted when the mouse is moved over an element of the overlay.
	- **mouseout**: Emitted when the mouse is moved outside of an element of the overlay.
- **Pan / Zoom**
	- **zoomstart**: Emitted when a new zoom event is handled.
	- **zoom**: Emitted during each frame of a zoom animation.
	- **zoomend**: Emitted when a zoom event is complete.
	- **panstart**: Emitted when a new pan event is handled.
	- **pan**: Emitted during each frame of a pan animation.
	- **panend**: Emitted when a pan event is complete.
