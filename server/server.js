(function() {

    'use strict';

    const path = require('path');
    const express = require('express');
    const compression = require('compression');
    const redis = require('./redis/redis');
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
        const hash = `${coord.z}:${coord.x}:${coord.y}:${resolution}`;

        // const buffer = mandelbrot(resolution, coord);
        // res.send(buffer);

        redis.cache(hash, done => {
            done(null, mandelbrot(resolution, coord));
        }, (err, buffer) => {
            if (err) {
                console.error(err.stack);
                res.status(500).send(err);
                return;
            }
            res.status(200).send(buffer);
        });
    });

    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });

}());
