(function() {

    'use strict';

    let esper = require('esper');
    let caleida = require('../src/exports');

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

        let plot = new caleida.Plot('#plot-canvas', {
            continuousZoom: false
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
            renderer: new caleida.Renderer()
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

        plot.add(base);

        let layer = new caleida.Layer({
            renderer: new caleida.Renderer()
        });

        // layer.on('tile:request', tile => {
        //     console.log(`request: ${tile.coord.hash}`);
        // });
        // layer.on('tile:add', tile => {
        //     console.log(`add: ${tile.coord.hash}, ${layer.pyramid.tiles.length} total tiles`);
        // });
        // layer.on('tile:remove', tile => {
        //     console.log(`remove: ${tile.coord.hash}, ${base.pyramid.tiles.length} total tiles`);
        // });

        layer.requestTile = (coord, done) => {
            const req = new XMLHttpRequest();
            req.open('GET', `mandelbrot/${coord.z}/${coord.x}/${coord.y}`, true);
            req.responseType = 'arraybuffer';
            req.onload = () => {
                const arraybuffer = req.response;
                if (arraybuffer) {
                    const bytes = new Uint8Array(arraybuffer);
                    const resolution = Math.sqrt(bytes.length / 4);
                    done(null, new esper.ColorTexture2D({
                        src: new Uint8Array(arraybuffer),
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

        // layer.opacity = 0.5;

        // plot.add(layer);
    };

}());
