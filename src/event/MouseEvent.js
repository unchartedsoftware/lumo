(function() {

    'use strict';

    const Event = require('./Event');

    class MouseEvent extends Event {
        constructor(target, button, viewPx, plotPx) {
            super();
            this.target = target;
            this.viewPx = viewPx;
            this.plotPx = plotPx;
            this.button = button;
        }
    }

    module.exports = MouseEvent;

}());
