(function() {

    'use strict';

    const redis = require('redis');

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
                    client.get(hash, done);
                } else {
                    task((err, res) => {
                        if (err) {
                            done(err, null);
                            return;
                        }
                        client.set(hash, res, err => {
                            if (err) {
                                done(err, null);
                                return;
                            }
                            done(null, res);
                        });
                    });
                }
            });
        }

    };

}());
