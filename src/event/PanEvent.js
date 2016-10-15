(function() {

    'use strict';

    const Event = require('./Event');

    class PanEvent extends Event {
        constructor(plot, prevPx, currentPx) {
            super();
            this.plot = plot;
            this.prevPx = prevPx;
            this.currentPx = currentPx;
        }
    }

    module.exports = PanEvent;

}());
