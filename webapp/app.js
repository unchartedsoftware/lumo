(function() {

    'use strict';

    const esper = require('esper');
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

        let plot = new caleida.Plot('#plot', {
            continuousZoom: false,
            inertia: true,
            wraparound: false
        });

        // WebGL Image Texture

        let base = new caleida.Layer({
            renderer: new caleida.TextureRenderer()
        });

        base.requestTile = (coord, done) => {
            let image = new Image();
            image.onload = () => {
                //done(null, image);
                done(null, new esper.ColorTexture2D({
                    src: image,
                    filter: 'LINEAR',
                    wrap: 'CLAMP_TO_EDGE',
                    mipMap: false,
                    premultiplyAlpha: false
                }));
            };
            image.onerror = (event) => {
                const err = `Unable to load image from URL: \`${event.path[0].currentSrc}\``;
                done(err, null);
            };
            image.crossOrigin = 'anonymous';
            const dim = Math.pow(2, coord.z);
            const s = SUBDOMAINS[(coord.x + coord.y + coord.z) % SUBDOMAINS.length];
            image.src = `http://${s}.basemaps.cartocdn.com/dark_nolabels/${coord.z}/${coord.x}/${dim - 1 - coord.y}.png`;
        };

        // base.opacity = 0.5;

        // plot.addLayer(base);

        // WebGL Buffer Texture

        let mandlebrot = new caleida.Layer({
            renderer: new caleida.TextureRenderer()
        });

        mandlebrot.requestTile = (coord, done) => {
            const req = new XMLHttpRequest();
            req.open('GET', `mandelbrot/${coord.z}/${coord.x}/${coord.y}`, true);
            req.responseType = 'arraybuffer';
            req.onload = () => {
                const arraybuffer = req.response;
                if (arraybuffer) {
                    const bytes = new Uint8Array(arraybuffer);
                    const resolution = Math.sqrt(bytes.length / 4);
                    done(null, new esper.ColorTexture2D({
                        src: bytes,
                        width: resolution,
                        height: resolution,
                        filter: 'LINEAR',
                        wrap: 'CLAMP_TO_EDGE',
                        mipMap: false,
                        premultiplyAlpha: false
                    }));
                }
            };
            req.send(null);
        };

        mandlebrot.opacity = 0.5;

        // plot.addLayer(mandlebrot);

        // WebGL Point

        let point = new caleida.Layer({
            renderer: new caleida.PointRenderer()
        });

        point.requestTile = (coord, done) => {
            const numPoints = 256 * 8;
            const buffer = new Float32Array(3 * numPoints);
            for (let i=0; i<numPoints; i++) {
                buffer[i*3] = Math.random() * 256; // x
                buffer[i*3+1] = Math.random() * 256; // y
                buffer[i*3+2] = (Math.random() * 4) + 2; // radius
            }
            done(null, buffer);
        };

        plot.addLayer(point);

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

        plot.on('frame:start', () => {
            stats.begin();
        });

        plot.on('frame:end', () => {
            stats.end();
        });
    };

}());
