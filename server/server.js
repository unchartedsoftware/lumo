(function() {

    'use strict';

    const path = require('path');
    const express = require('express');
    const compression = require('compression');
    const mandelbrot = require('./routes/mandelbrot');
    const app = express();
    const port = 8080;
    const build = path.normalize(__dirname + '/../build');

    app.use(compression());
    app.use(express.static(build));
    app.get('/mandelbrot/:z/:x/:y', (req, res) => {
        const coord = {
            x: req.params.x,
            y: req.params.y,
            z: req.params.z
        };
        const resolution = 256;
        const bytes = mandelbrot(resolution, coord);
        res.send(new Buffer(bytes.buffer));
    });
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });

}());
