(function() {

    'use strict';

    let esper = require('esper');
    let caleida = require('./scripts/exports');
    let julia = require('./scripts/julia/julia');

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

        let layer = new caleida.Layer({
            renderer: new caleida.Renderer()
        });

        layer.on('tile:request', tile => {
            console.log('request: ' + tile.coord.hash);
        });
        // layer.on('tile:add', tile => {
        //     console.log('add: ' + tile.coord.hash + ', ' + layer.tiles.numTiles + ' total tiles');
        // });
        // layer.on('tile:success', tile => {
        //     console.log('success: ' + tile.coord.hash);
        // });
        // layer.on('tile:remove', tile => {
        //     console.log('remove: ' + tile.coord.hash + ', ' + layer.tiles.numTiles + ' total tiles');
        // });
        // layer.on('tile:discard', tile => {
        //     console.log('discard: ' + tile.coord.hash);
        // });

        layer.requestTile = (coord, done) => {

            const resolution = 64;

            // // create web worker to generate tile
            // let worker = new Worker('worker.js');
            // worker.addEventListener('message', event => {
            //     done(null, new esper.ColorTexture2D({
            //         src: new Uint8Array(event.data.buffer),
            //         width: resolution,
            //         height: resolution,
            //         filter: 'NEAREST',
            //         wrap: 'CLAMP_TO_EDGE',
            //         mipMap: false
            //     }));
            //     worker.terminate();
            //     worker = null;
            // });
            // // start the webworker
            // worker.postMessage({
            //     resolution: resolution,
            //     coord: coord
            // });

            done(null, new esper.ColorTexture2D({
                src: julia(resolution, coord),
                width: resolution,
                height: resolution,
                filter: 'NEAREST',
                wrap: 'CLAMP_TO_EDGE',
                mipMap: false
            }));
        };

        plot.add(layer);

    };

}());
