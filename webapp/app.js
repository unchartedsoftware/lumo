(function() {

    'use strict';

    let caleida = require('./scripts/exports');

    window.start = function() {

        let plot = new caleida.Plot('#plot-canvas');

        // plot.on('pan', () => {
        //     console.log(`pan: ${plot.viewportPx[0]}, ${plot.viewportPx[1]}`);
        // });
        //
        // plot.on('resize', () => {
        //     console.log(`resize: ${plot.viewport[0]}, ${plot.viewport[1]}`);
        // });

        let layer = new caleida.Layer({
            renderer: new caleida.Renderer()
        });

        // layer.on('tile:request', tile => {
        //     console.log('request' + tile.coord.hash);
        // });
        // layer.on('tile:add', tile => {
        //     console.log('add' + tile.coord.hash);
        // });
        // layer.on('tile:success', tile => {
        //     console.log('success' + tile.coord.hash);
        // });
        // layer.on('tile:remove', tile => {
        //     console.log('remove' + tile.coord.hash);
        // });

        layer.requestTile = (tile, done) => {
            setTimeout(() => {
                done(null, {});
            }, Math.random() * 500);
        };

        plot.add(layer);

    };

}());
