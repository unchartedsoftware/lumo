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
 * Number of persistent zoom levels held in the pyramids.
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

/**
 * The maximum distance to traverse when checking for tile ancestors.
 * @private
 * @constant {Number}
 */
const MAX_ANCESTOR_DIST = 16;

/**
 * The maximum distance to traverse when checking for tile descendants.
 * @private
 * @constant {Number}
 */
const MAX_DESCENDENT_DIST = 4;

// Private Methods

const getAncestorUVOffset = function(descendant, ancestor) {
	const scale = Math.pow(2, descendant.z - ancestor.z);
	const step = 1 / scale;
	const scaled = {
		x: ancestor.x * scale,
		y: ancestor.y * scale
	};
	return [
		(descendant.x - scaled.x) * step,
		(descendant.y - scaled.y) * step,
		step,
		step
	];
};

const getDescendantOffset = function(ancestor, descendant) {
	const scale = Math.pow(2, descendant.z - ancestor.z);
	const step = 1 / scale;
	const scaled = {
		x: ancestor.x * scale,
		y: ancestor.y * scale
	};
	return {
		x: (descendant.x - scaled.x) * step,
		y: (descendant.y - scaled.y) * step,
		scale: step
	};
};

const add = function(pyramid, tile) {
	if (tile.coord.z < pyramid.persistentLevels) {
		// persistent tiles
		if (pyramid.persistents.has(tile.coord.hash)) {
			throw `Tile of coord ${tile.coord.hash} already exists in the pyramid`;
		}
		pyramid.persistents.set(tile.coord.hash, tile);
	} else {
		// non-persistent tiles
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
	// only check for persistent since we it will already be removed from lru
	// cache
	if (tile.coord.z < pyramid.persistentLevels) {
		if (!pyramid.persistents.has(tile.coord.hash)) {
			throw `Tile of coord ${tile.coord.hash} does not exists in the pyramid`;
		}
		pyramid.persistents.delete(tile.coord.hash);
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

const sortAroundCenter = function(plot, pairs) {
	// get the plot center position
	const center = plot.getTargetViewportCenter();
	// sort the requests by distance from center tile
	pairs.sort((a, b) => {
		const aCenter = a.coord.getCenter();
		const bCenter = b.coord.getCenter();
		const dax = center.x - aCenter.x;
		const day = center.y - aCenter.y;
		const dbx = center.x - bCenter.x;
		const dby = center.y - bCenter.y;
		const da = dax * dax + day * day;
		const db = dbx * dbx + dby * dby;
		return da - db;
	});
	return pairs;
};

const removeDuplicates = function(pairs) {
	const seen = new Map();
	return pairs.filter(function(pair) {
		const hash = pair.ncoord.hash;
		return seen.has(hash) ? false : (seen.set(hash, true));
	});
};

const removePendingOrExisting = function(pyramid, pairs) {
	return pairs.filter(pair => {
		// we already have the tile, or it's currently pending
		// NOTE: use `get` here to update the recentness of the tile in LRU
		return !pyramid.get(pair.ncoord) && !pyramid.isPending(pair.ncoord);
	});
};

const flagTileAsStale = function(pyramid, tile) {
	const hash = tile.coord.hash;
	let uids = pyramid.stale.get(hash);
	if (!uids) {
		uids = new Map();
		pyramid.stale.set(hash, uids);
	}
	uids.set(tile.uid, true);
};

const isTileStale = function(pyramid, tile) {
	const hash = tile.coord.hash;
	// check if uid is flagged as stale
	const uids = pyramid.stale.get(hash);
	if (uids && uids.has(tile.uid)) {
		// tile is stale
		uids.delete(tile.uid);
		if (uids.size === 0) {
			pyramid.stale.delete(hash);
		}
		return true;
	}
	return false;
};

const shouldDiscard = function(pyramid, tile) {
	const plot = pyramid.layer.plot;
	if (!plot) {
		// layer has been removed from plot, discard tile
		return true;
	}
	// check if tile is in view, if not, discard
	const viewport = plot.getTargetViewport();
	return !viewport.isInView(tile.coord, plot.wraparound);
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
	 * @param {Number} options.persistentLevels - The number of persistent levels in the pyramid.
	 */
	constructor(layer, options = {}) {
		if (!layer) {
			throw 'No layer parameter provided';
		}
		this.cacheSize = defaultTo(options.cacheSize, CACHE_SIZE);
		this.persistentLevels = defaultTo(options.persistentLevels, PERSISTANT_LEVELS);
		this.layer = layer;
		this.levels = new Map();
		this.persistents = new Map();
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
	 * Returns the total capacity of the tile pyramid.
	 */
	getCapacity() {
		return this.cacheSize + sumPowerOfFour(this.persistentLevels);
	}

	/**
	 * Empties the current pyramid of all tiles, flags any pending tiles as
	 * stale.
	 */
	clear() {
		// any pending tiles are now flagged as stale
		this.pending.forEach(tile => {
			// flag uid as stale
			flagTileAsStale(this, tile);
		});
		this.pending = new Map(); // fresh map
		// clear persistent tiles
		this.persistents.forEach(tile => {
			remove(this, tile);
		});
		this.persistents.clear();
		// clear lru cache
		this.tiles.reset();
	}

	/**
	 * Test whether or not a coord is held in cache in the pyramid.
	 *
	 * @param {Coord} coord - The coord to test.
	 *
	 * @returns {boolean} Whether or not the coord exists in the pyramid.
	 */
	has(coord) {
		if (coord.z < this.persistentLevels) {
			return this.persistents.has(coord.hash);
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
		if (coord.z < this.persistentLevels) {
			return this.persistents.get(coord.hash);
		}
		return this.tiles.get(coord.hash);
	}

	/**
	 * Returns the ancestor tile of the coord at the provided offset. If no
	 * tile exists in the pyramid, returns undefined.
	 *
	 * @param {Coord} coord - The coord of the tile.
	 * @param {Number} dist - The offset from the tile. Optional.
	 *
	 * @return {Tile} The ancestor tile of the provided coord.
	 */
	getAncestor(coord, dist = 1) {
		const level = coord.z - dist;
		if (!this.levels.has(level) || level < this.layer.plot.minZoom) {
			return undefined;
		}
		const ancestor = coord.getAncestor(coord.z - level);
		return this.get(ancestor);
	}

	/**
	 * Returns the descendant tiles of the coord at the provided offset. If no
	 * tile exists in the pyramid, returns undefined.
	 *
	 * @param {Coord} coord - The coord of the tile.
	 * @param {Number} dist - The offset from the tile. Optional.
	 *
	 * @return {Array} The descendant tiles of the provided coord.
	 */
	getDescendants(coord, dist = 1) {
		const level = coord.z + dist;
		if (!this.levels.has(level) || level > this.layer.plot.maxZoom) {
			return undefined;
		}
		// check for closest descendants
		const descendants = coord.getDescendants(level - coord.z);
		const res = [];
		for (let i=0; i<descendants.length; i++) {
			const descendant = this.get(descendants[i]);
			if (descendant) {
				res.push(descendant);
			}
		}
		return res.length > 0 ? res : undefined;
	}

	/**
	 * Requests tiles for the provided coords. If the tiles already exist
	 * in the pyramid or is currently pending no request is made.
	 *
	 * @param {Array} coords - The array of coords to request.
	 */
	requestTiles(coords) {

		// we need both the normalized an un-normalized coords.
		// normalized coords are used for requests while un-normalized are used
		// to sort them around the viewport center
		let pairs = coords.map(coord => {
			return {
				coord: coord,
				ncoord: coord.normalize()
			};
		});

		// remove any duplicates
		pairs = removeDuplicates(pairs);

		// remove any tiles we already have or that are currently pending
		pairs = removePendingOrExisting(this, pairs);

		// sort coords by distance from viewport center
		pairs = sortAroundCenter(this.layer.plot, pairs);

		// generate tiles and flag as pending
		// NOTE: we flag them all now incase a `clear` is called inside the
		// `requestTile` call.
		const tiles = pairs.map(pair => {
			const tile = new Tile(pair.ncoord);
			// add tile to pending array
			this.pending.set(tile.coord.hash, tile);
			return tile;
		});

		// request tiles
		tiles.forEach(tile => {
			// emit request
			this.layer.emit(EventType.TILE_REQUEST, new TileEvent(this.layer, tile));
			// request tile
			this.layer.requestTile(tile.coord, (err, data) => {
				// check if stale, clears tiles any flagged as stale
				const isStale = isTileStale(this, tile);
				// if not stale remove tile from pending
				if (!isStale) {
					this.pending.delete(tile.coord.hash);
				}
				// check err
				if (err !== null) {
					// add err
					tile.err = err;
					// emit failure
					this.layer.emit(EventType.TILE_FAILURE, new TileEvent(this.layer, tile));
					// if not stale, check if loaded
					if (!isStale) {
						checkIfLoaded(this);
					}
					return;
				}
				// add data to the tile
				tile.data = data;
				// check if tile should be discarded
				if (isStale || shouldDiscard(this, tile)) {
					// emit discard
					this.layer.emit(EventType.TILE_DISCARD, new TileEvent(this.layer, tile));
					// if not stale, check if loaded
					if (!isStale) {
						checkIfLoaded(this);
					}
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
	 * @param {Coord} coord - The coord of the tile.
	 *
	 * @return {Tile} The tile that closest matches the provided coord.
	 */
	getAvailableLOD(coord) {
		const ncoord = coord.normalize();
		// check if we have the tile
		const tile = this.get(ncoord);
		if (tile) {
			return [{
				coord: coord,
				tile: tile,
				uvOffset: [ 0, 0, 1, 1 ],
				offset: { x: 0, y: 0, scale: 1 }
			}];
		}
		// get ancestor and descendant levels to check
		for (let i=0; i<MAX_ANCESTOR_DIST; i++) {
			// try to find ancestor
			const ancestor = this.getAncestor(ncoord, i);
			if (ancestor) {
				return [{
					coord: coord,
					tile: ancestor,
					uvOffset: getAncestorUVOffset(ncoord, ancestor.coord),
					offset: { x: 0, y: 0, scale: 1 }
				}];
			}
			// descendant checks are much more expensive, so limit this
			if (i < MAX_DESCENDENT_DIST) {
				// try to find descendant
				const descendants = this.getDescendants(ncoord, i);
				if (descendants) {
					const res = new Array(descendants.length);
					for (let j=0; j<descendants.length; j++) {
						const descendant = descendants[j];
						res[j] = {
							coord: coord,
							tile: descendant,
							uvOffset: [ 0, 0, 1, 1 ],
							offset: getDescendantOffset(ncoord, descendant.coord)
						};
					}
					return res;
				}
			}
		}
		return undefined;
	}
}

module.exports = TilePyramid;
