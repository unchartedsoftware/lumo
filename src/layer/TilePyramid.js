'use strict';

const defaultTo = require('lodash/defaultTo');
const throttle = require('lodash/throttle');
const LRU = require('lru-cache');
const Tile = require('../core/Tile');
const EventType = require('../event/EventType');
const TileEvent = require('../event/TileEvent');

// Constants

/**
 * Number of the tiles held in the pyramid.
 * @private
 * @constant {Number}
 */
const CACHE_SIZE = 256;

/**
 * Number of persistant zoom levels held in the pyramids.
 * @private
 * @constant {Number}
 */
const PERSISTANT_LEVELS = 4;

/**
 * Loaded event throttle in milliseconds.
 * @private
 * @constant {Number}
 */
const LOADED_THROTTLE_MS = 200;

// Private Methods

const getLODOffset = function(descendant, ancestor) {
	const scale = Math.pow(2, descendant.z - ancestor.z);
	const step = 1 / scale;
	const root = {
		x: ancestor.x * scale,
		y: ancestor.y * scale
	};
	return {
		x: (descendant.x - root.x) * step,
		y: (descendant.y - root.y) * step,
		extent: step
	};
};

const add = function(pyramid, tile) {
	if (tile.coord.z < pyramid.persistantLevels) {
		// persistant tiles
		if (pyramid.persistants.has(tile.coord.hash)) {
			throw `Tile of coord ${tile.coord.hash} already exists in the pyramid`;
		}
		pyramid.persistants.set(tile.coord.hash, tile);
	} else {
		// non-persistant tiles
		if (pyramid.tiles.has(tile.coord.hash)) {
			throw `Tile of coord ${tile.coord.hash} already exists in the pyramid`;
		}
		pyramid.tiles.set(tile.coord.hash, tile);
	}
	// store in level arrays
	if (!pyramid.levels.has(tile.coord.z)) {
		pyramid.levels.set(tile.coord.z, []);
	}
	pyramid.levels.get(tile.coord.z).push(tile);
	// emit add
	pyramid.layer.emit(EventType.TILE_ADD, new TileEvent(pyramid.layer, tile));
};

const remove = function(pyramid, tile) {
	if (tile.coord.z < pyramid.persistantLevels) {
		throw `Tile of coord ${tile.coord.hash} is flagged as persistant and cannot be removed`;
	}
	if (!pyramid.tiles.has(tile.coord.hash)) {
		throw `Tile of coord ${tile.coord.hash} does not exists in the pyramid`;
	}
	// remove from levels
	const level = pyramid.levels.get(tile.coord.z);
	level.splice(level.indexOf(tile), 1);
	if (level.length === 0) {
		pyramid.levels.delete(tile.coord.z);
	}
	// emit remove
	pyramid.layer.emit(EventType.TILE_REMOVE, new TileEvent(pyramid.layer, tile));
};

const sumPowerOfFour = function(n) {
	return (1/3) * (Math.pow(4, n) - 1);
};

const checkIfLoaded = function(pyramid) {
	// if no more pending tiles, emit load
	if (pyramid.pending.size === 0) {
		pyramid.emitLoad(new TileEvent(pyramid.layer, null));
	}
};

const sortAroundCenter = function(plot, coords) {
	// get the center plot pixel
	let center = null;
	let zoom = 0;
	if (plot.zoomAnimation) {
		center = plot.zoomAnimation.targetViewport.getCenter();
		zoom = plot.zoomAnimation.targetZoom;
	} else {
		center = plot.viewport.getCenter();
		zoom = plot.zoom;
	}
	// get the scaled tile size
	const tileSize = plot.tileSize * Math.pow(2, (zoom - Math.round(zoom)));
	// convert center to tile coords
	center.x /= tileSize;
	center.y /= tileSize;
	// sort the requests by distance from center tile
	coords.sort((a, b) => {
		const dax = center.x - (a.x + 0.5);
		const day = center.y - (a.y + 0.5);
		const dbx = center.x - (b.x + 0.5);
		const dby = center.y - (b.y + 0.5);
		const da = dax * dax + day * day;
		const db = dbx * dbx + dby * dby;
		a.d = da;
		b.d = db;
		return da - db;
	});
	return coords;
};

const removeDuplicates = function(coords) {
	const seen = new Map();
	return coords.filter(function(coord) {
		return seen.has(coord.hash) ? false : (seen.set(coord.hash, true));
	});
};

/**
 * Class representing a pyramid of tiles.
 */
class TilePyramid {

	/**
	 * Instantiates a new Bounds object.
	 *
	 * @param {Layer} layer - The layer object.
	 * @param {Object} options - The pyramid options.
	 * @param {Number} options.cacheSize - The size of the tile cache.
	 * @param {Number} options.persistantLevels - The number of persistant levels in the pyramid.
	 */
	constructor(layer, options = {}) {
		if (!layer) {
			throw 'No layer parameter provided';
		}
		this.cacheSize = defaultTo(options.cacheSize, CACHE_SIZE);
		this.persistantLevels = defaultTo(options.persistantLevels, PERSISTANT_LEVELS);
		this.totalCapacity = this.cacheSize + sumPowerOfFour(this.persistantLevels);
		this.layer = layer;
		this.levels = new Map();
		this.persistants = new Map();
		this.pending = new Map();
		this.stale = new Map();
		this.tiles = new LRU({
			max: this.cacheSize,
			dispose: (key, tile) => {
				remove(this, tile);
			}
		});
		// create throttled emit load event for this layer
		this.emitLoad = throttle(event => {
			this.layer.emit(EventType.LOAD, event);
		}, LOADED_THROTTLE_MS);
	}

	/**
	 * Empties the current pyramid of all tiles, flags any pending tiles as
	 * stale.
	 */
	clear() {
		// any pending tiles are now flagged as stale
		this.stale = this.pending;
		// clear all tile data
		this.levels = new Map();
		this.persistants = new Map();
		this.pending = new Map();
		this.tiles = new LRU({
			max: this.cacheSize,
			dispose: (key, tile) => {
				remove(this, tile);
			}
		});
	}

	/**
	 * Test whether or not a coord is held in cache in the pyramid.
	 *
	 * @param {Coord} coord - The coord to test.
	 *
	 * @returns {boolean} Whether or not the coord exists in the pyramid.
	 */
	has(coord) {
		if (coord.z < this.persistantLevels) {
			return this.persistants.has(coord.hash);
		}
		return this.tiles.has(coord.hash);
	}

	/**
	 * Test whether or not a coord is currently pending.
	 *
	 * @param {Coord} coord - The coord to test.
	 *
	 * @returns {boolean} Whether or not the coord is currently pending.
	 */
	isPending(coord) {
		return this.pending.has(coord.hash);
	}

	/**
	 * Returns the tile matching the provided coord. If the tile does not
	 * exist, returns undefined.
	 *
	 * @param {Coord} coord - The coord of the tile to return.
	 *
	 * @returns {Tile} The tile object.
	 */
	get(coord) {
		if (coord.z < this.persistantLevels) {
			return this.persistants.get(coord.hash);
		}
		return this.tiles.get(coord.hash);
	}

	/**
	 * Returns the closest ancestor of the provided coord. If no ancestor
	 * exists in the pyramid, returns undefined.
	 *
	 * @param {Coord} coord - The coord of the tile.
	 *
	 * @return {Coord} The closest available ancestor of the provided coord.
	 */
	getClosestAncestor(coord) {
		// get ancestors levels, in descending order
		const levels = [...this.levels.keys()]
			.sort((a, b) => {
				// sort by key
				return b - a;
			}).filter(entry => {
				// filter by key
				return (entry < coord.z);
			});
		// check for closest ancestor
		for (let i=0; i<levels.length; i++) {
			const level = levels[i];
			const ancestor = coord.getAncestor(coord.z - level);
			if (this.has(ancestor)) {
				return ancestor;
			}
		}
		return undefined;
	}

	/**
	 * Returns true if the coordinate is no in the current or target
	 * viewport.
	 *
	 * @param {Coord} coord - The coord to test.
	 *
	 * @returns {boolean} Whether or not the tile is stale.
	 */
	isStale(coord) {
		// check if it is flagged as stale
		const ncoord = coord.normalize();
		if (this.stale.has(ncoord.hash)) {
			this.stale.delete(ncoord.hash);
			return true;
		}
		const plot = this.layer.plot;
		if (!plot) {
			// layer has been removed from plot, tile is stale
			return true;
		}
		const animation = plot.zoomAnimation;
		// if zooming, use target zoom, if not use current zoom
		const viewport = animation ? animation.targetViewport : plot.viewport;
		const zoom = animation ? animation.targetZoom : plot.zoom;
		return !viewport.isInView(plot.tileSize, coord, zoom);
	}

	/**
	 * Requests tiles for the provided coords. If the tiles already exist
	 * in the pyramid or is currently pending no request is made.
	 *
	 * @param {Array} coords - The array of coords to request.
	 */
	requestTiles(coords) {

		// remove any duplicates
		coords = removeDuplicates(coords);

		// filter out coords we don't need to request
		coords = coords.filter(coord => {
			// get normalized coord, we use normalized coords for requests
			// so that we do not track / request the same tiles
			const ncoord = coord.normalize();
			// we already have the tile, or it's currently pending
			return !this.has(ncoord) && !this.isPending(ncoord);
		});

		// sort coords by distance from viewport center
		coords = sortAroundCenter(this.layer.plot, coords);

		// request tiles
		coords.forEach(coord => {
			// get normalized coord, we use normalized coords for requests
			// so that we do not track / request the same tiles
			const ncoord = coord.normalize();
			// we already have the tile, or it's currently pending
			// NOTE: do this again here in case of any duplicates
			if (this.has(ncoord) || this.isPending(ncoord)) {
				return;
			}
			// create the new tile
			const tile = new Tile(ncoord);
			// add tile to pending array
			this.pending.set(ncoord.hash, tile);
			// emit request
			this.layer.emit(EventType.TILE_REQUEST, new TileEvent(this.layer, tile));
			// request tile
			this.layer.requestTile(ncoord, (err, data) => {
				// remove tile from pending
				this.pending.delete(ncoord.hash);
				// check err
				if (err !== null) {
					// add err
					tile.err = err;
					// emit failure
					this.layer.emit(EventType.TILE_FAILURE, new TileEvent(this.layer, tile));
					// check if loaded
					checkIfLoaded(this);
					return;
				}
				// add data to the tile
				tile.data = data;
				// check if tile is stale
				if (this.isStale(coord)) {
					// emit discard
					this.layer.emit(EventType.TILE_DISCARD, new TileEvent(this.layer, tile));
					// check if loaded
					checkIfLoaded(this);
					return;
				}
				// add to tile pyramid
				add(this, tile);
				// check if loaded
				checkIfLoaded(this);
			});
		});
	}

	/**
	 * If the tile exists in the pyramid, return it. Otherwise return the
	 * closest available tile, along with the offset and relative scale. If
	 * no ancestor exists, return undefined.
	 *
	 * @return {Tile} The tile that closest matches the provided coord.
	 */
	getAvailableLOD(coord) {
		const ncoord = coord.normalize();
		// check if we have the tile
		if (this.has(ncoord)) {
			return {
				coord: coord,
				tile: this.get(ncoord),
				offset: {
					x: 0,
					y: 0,
					extent: 1
				}
			};
		}
		// if not, take the closest ancestor
		const ancestor = this.getClosestAncestor(ncoord);
		if (ancestor) {
			return {
				coord: coord,
				tile: this.get(ancestor),
				offset: getLODOffset(ncoord, ancestor)
			};
		}
		return undefined;
	}
}

module.exports = TilePyramid;
