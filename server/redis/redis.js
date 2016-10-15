(function() {

    'use strict';

    const redis = require('redis');
    const zlib = require('zlib');

    let client = null;

    module.exports = {

        cache: function(hash, task, done) {
            if (!client) {
                client = redis.createClient({
                    return_buffers: true,
                    retry_strategy: () => {
                        return 5000;
                    }
                });
                client.on('error', err => {
                    console.error(err);
                });
            }
            if (!client.connected) {
                task(done);
                return;
            }
            client.exists(hash, (err, exists) => {
                if (err) {
                    done(err, null);
                    return;
                }
                if (exists) {
                    client.get(hash, (err, res) => {
                        zlib.unzip(res, done);
                    });
                } else {
                    task((err, res) => {
                        if (err) {
                            done(err, null);
                            return;
                        }
                        zlib.gzip(res, (err, zipped) => {
                            if (err) {
                                done(err, null);
                                return;
                            }
                            client.set(hash, zipped, err => {
                                if (err) {
                                    done(err, null);
                                    return;
                                }
                                done(null, res);
                            });
                        });
                    });
                }
            });
        }

    };

}());
