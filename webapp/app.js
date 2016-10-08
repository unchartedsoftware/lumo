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

    // const normalizePoints = function(points, coord) {
    //     const tileSpan = 4294967296 / Math.pow(2, coord.z);
    //     const xOffset = coord.x * tileSpan;
    //     const yOffset = coord.y * tileSpan;
    //     const buffer = new Float32Array(points.length);
    //     for (let i=0; i<points.length; i+=2) {
    //         buffer[i] = points[i] - xOffset;
    //         buffer[i+1] = points[i+1] - yOffset;
    //     }
    //     return buffer;
    // };

    window.start = function() {


        let plot = new caleida.Plot('#plot-canvas', {
            continuousZoom: false,
            inertia: true,
            wraparound: true
        });

        // plot.on('pan', () => {
        //     console.log(`pan: ${plot.viewport.x}, ${plot.viewport.y}`);
        // });
        // plot.on('resize', () => {
        //     console.log(`resize: ${plot.viewport.width}, ${plot.viewport.height}`);
        // });
        // plot.on('zoom:start', () => {
        //     console.log(`zoom start: ${plot.zoom}`);
        // });
        // plot.on('zoom:end', () => {
        //     console.log(`zoom end: ${plot.zoom}`);
        // });

        let base = new caleida.Layer({
            renderer: new caleida.TextureRenderer()
        });

        base.requestTile = (coord, done) => {
            let image = new Image();
            image.onload = () => {
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

        // base.on('tile:request', tile => {
        //     console.log(`request: ${tile.coord.hash}`);
        // });
        // base.on('tile:add', tile => {
        //     console.log(`add: ${tile.coord.hash}, ${base.pyramid.tiles.length} total tiles`);
        // });
        // base.on('tile:remove', tile => {
        //     console.log(`remove: ${tile.coord.hash}, ${base.pyramid.tiles.length} total tiles`);
        // });

        // base.opacity = 0.5;

        // plot.addLayer(base);

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

        // mandlebrot.opacity = 0.5;

        // plot.addLayer(mandlebrot);

        let point = new caleida.Layer({
            renderer: new caleida.PointRenderer()
        });

        point.requestTile = (coord, done) => {
            const numPoints = 256 * 16;
            const buffer = new Float32Array((2 + 1) * numPoints);
            for (let i=0; i<numPoints; i++) {
                buffer[i*3] = Math.random() * 256; // x
                buffer[i*3+1] = Math.random() * 256; // y
                buffer[i*3+2] = (Math.random() * 4) + 1; // radius
            }
            done(null, buffer);
        };

        plot.addLayer(point);

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
