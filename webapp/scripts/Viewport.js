(function() {

    'use strict';

    const EventEmitter = require('events');
    const glm = require('gl-matrix');

    // Class / Public Methods

    class Viewport extends EventEmitter {
        constructor(spec = {}) {
            super();
            this.pos = glm.vec2.fromValues(
                spec.pos ? spec.pos[0] : 0,
                spec.pos ? spec.pos[1] : 0);
            this.width = spec.width;
            this.height = spec.height;
        }
    }

    module.exports = Viewport;

}());
