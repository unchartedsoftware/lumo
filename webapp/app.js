(function() {

    'use strict';

    let esper = require('esper');
    let caleida = require('../src/exports');

    const SUBDOMAINS = [
        'a', 'b', 'c',
        'd', 'e', 'f',
        'g', 'h', 'i'
    ];

    window.start = function() {

        let plot = new caleida.Plot('#plot-canvas');

        // plot.on('pan', () => {
        //     console.log(`pan: ${plot.viewport.pos[0]}, ${plot.viewport.pos[1]}`);
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
                    preMultiplyAlpha: false //true
                }));
            };
            image.onerror = (event) => {
                const err = `Unable to load image from URL: \`${event.path[0].currentSrc}\``;
                done(err, null);
            };
            image.crossOrigin = 'anonymous';
            const dim = Math.pow(2, coord.z);
            const s = SUBDOMAINS[(coord.x + coord.y + coord.z) % SUBDOMAINS.length];
            image.src = `http://${s}.basemaps.cartocdn.com/light_all/${coord.z}/${coord.x}/${dim - 1 - coord.y}.png`;
        };

        base.on('tile:add', tile => {
            console.log('add: ' + tile.coord.hash + ', ' + base.pyramid.numTiles + ' total tiles');
        });
        base.on('tile:remove', tile => {
            console.log('remove: ' + tile.coord.hash + ', ' + base.pyramid.numTiles + ' total tiles');
        });

        base.opacity = 0.5;

        plot.add(base);

        let layer = new caleida.Layer({
            renderer: new caleida.Renderer()
        });

        // layer.on('tile:request', tile => {
        //     console.log('request: ' + tile.coord.hash);
        // });
        // layer.on('tile:add', tile => {
        //     console.log('add: ' + tile.coord.hash + ', ' + layer.pyramid.numTiles + ' total tiles');
        // });
        // layer.on('tile:success', tile => {
        //     console.log('success: ' + tile.coord.hash);
        // });
        // layer.on('tile:remove', tile => {
        //     console.log('remove: ' + tile.coord.hash + ', ' + layer.pyramid.numTiles + ' total tiles');
        // });
        // layer.on('tile:discard', tile => {
        //     console.log('discard: ' + tile.coord.hash);
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
                        preMultiplyAlpha: false
                    }));
                }
            };
            req.send(null);
        };

        // layer.opacity = 0.5;

        // plot.add(layer);

    };

}());
