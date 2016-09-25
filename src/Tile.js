(function() {

    'use strict';

    // Class / Public Methods

    class Tile {
        constructor(coord) {
            this.coord = coord;
            this.data = null;
            this.err = null;
        }
    }

    module.exports = Tile;

}());
