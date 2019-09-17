'use strict';

const defaultTo = require('lodash/defaultTo');
const throttle = require('lodash/throttle');
const EventType = require('../../event/EventType');
const TileEvent = require('../../event/TileEvent');
const LRUCache = require('../../util/LRUCache');
const Tile = require('./Tile');
const TilePartial = require('./TilePartial');

// Constants

/**
 * number of the tiles held in the pyramid.
 *
 * @private
 * @constant {number}
 */
const CACHE_SIZE = 256;

/**
 * number of persistent zoom levels held in the pyramids.
 *
 * @private
 * @constant {number}
 */
const PERSISTANT_LEVELS = 4;

/**
 * Loaded event throttle in milliseconds.
 *
 * @private
 * @constant {number}
 */
const LOADED_THROTTLE_MS = 200;

/**
 * The maximum distance to traverse when checking for tile descendants.
 *
 * @private
 * @constant {number}
 */
const MAX_DESCENDENT_DIST = 4;

// Private Methods

const add = function(pyramid, tile) {
	if (tile.coord.z < pyramid.numPersistentLevels) {
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
	if (tile.coord.z < pyramid.numPersistentLevels) {
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
		// NOTE: this should _NEVER_ happen, since when a layer is remove from
		// the plot, the pending tiles are all flagged as stale.
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
	 * Instantiates a new TilePyramid object.
	 *
	 * @param {Layer} layer - The layer object.
	 * @param {object} options - The pyramid options.
	 * @param {number} options.cacheSize - The size of the tile cache.
	 * @param {number} options.numPersistentLevels - The number of persistent levels in the pyramid.
	 */
	constructor(layer, options = {}) {
		if (!layer) {
			throw 'No layer parameter provided';
		}
		this.cacheSize = defaultTo(options.cacheSize, CACHE_SIZE);
		this.numPersistentLevels = defaultTo(options.numPersistentLevels, PERSISTANT_LEVELS);
		this.layer = layer;
		this.levels = new Map();
		this.persistents = new Map();
		this.pending = new Map();
		this.stale = new Map();
		this.tiles = new LRUCache({
			capacity: this.cacheSize,
			onRemove: tile => {
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
	 *
	 * @returns {number} The total capacity of the pyramid.
	 */
	getCapacity() {
		return this.cacheSize + sumPowerOfFour(this.numPersistentLevels);
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
		this.tiles.clear();
	}

	/**
	 * Test whether or not a coord is held in cache in the pyramid.
	 *
	 * @param {TileCoord} ncoord - The normalized coord to test.
	 *
	 * @returns {boolean} Whether or not the coord exists in the pyramid.
	 */
	has(ncoord) {
		if (ncoord.z < this.numPersistentLevels) {
			return this.persistents.has(ncoord.hash);
		}
		return this.tiles.has(ncoord.hash);
	}

	/**
	 * Iterates over and executes the provided function for all tiles.
	 *
	 * @param {Function} fn - The function to execute on each tile.
	 */
	forEach(fn) {
		this.persistents.forEach(fn);
		this.tiles.forEach(fn);
	}

	/**
	 * Test whether or not a coord is currently pending.
	 *
	 * @param {TileCoord} ncoord - The normalized coord to test.
	 *
	 * @returns {boolean} Whether or not the coord is currently pending.
	 */
	isPending(ncoord) {
		return this.pending.has(ncoord.hash);
	}

	/**
	 * Returns the tile matching the provided coord. If the tile does not
	 * exist, returns undefined.
	 *
	 * @param {TileCoord} ncoord - The normalized coord of the tile to return.
	 *
	 * @returns {Tile} The tile object.
	 */
	get(ncoord) {
		if (ncoord.z < this.numPersistentLevels) {
			return this.persistents.get(ncoord.hash);
		}
		return this.tiles.get(ncoord.hash);
	}

	/**
	 * Returns the ancestor tile of the coord at the provided offset. If no
	 * tile exists in the pyramid, returns undefined.
	 *
	 * @param {TileCoord} ncoord - The normalized coord of the tile.
	 * @param {number} dist - The offset from the tile.
	 *
	 * @returns {Tile} The ancestor tile of the provided coord.
	 */
	getAncestor(ncoord, dist) {
		const ancestor = ncoord.getAncestor(dist);
		return this.get(ancestor);
	}

	/**
	 * Returns the descendant tiles of the coord at the provided offset. If at
	 * least one tile exists in the pyramid, an array of size 4^dist will be
	 * returned. Each element will either be a tile (in the case that it exists)
	 * or a coord (in the case that it does not exist). If no descendant tiles
	 * are found in the pyramid, returns undefined.
	 *
	 * @param {TileCoord} ncoord - The normalized coord of the tile.
	 * @param {number} dist - The offset from the tile.
	 *
	 * @returns {Array} The descendant tiles and or coordinates of the provided coord.
	 */
	getDescendants(ncoord, dist) {
		// get coord descendants
		const descendants = ncoord.getDescendants(dist);
		// check if we have any
		let found = false;
		for (let i=0; i<descendants.length; i++) {
			if (this.has(descendants[i])) {
				found = true;
				break;
			}
		}
		// if so return what we have
		if (found) {
			const res = new Array(descendants.length);
			for (let i=0; i<descendants.length; i++) {
				const descendant = descendants[i];
				// add tile if it exists, coord if it doesn't
				res[i] = this.get(descendant) || descendant;
			}
			return res;
		}
		return undefined;
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

		// request the tiles
		for (let i=0; i<tiles.length; i++) {
			const tile = tiles[i];
			// emit request
			this.layer.emit(EventType.TILE_REQUEST, new TileEvent(this.layer, tile));
			// request tile
			this.layer.requestTile(tile.coord, (err, data) => {
				// check if stale, clears stale status
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
				// flag as dirty
				this.layer.plot.setDirty();
			});
		}
	}

	/**
	 * If the tile exists in the pyramid, return it. Otherwise return the
	 * closest available level-of-detail for tile, this may be a single ancestor
	 * or multiple descendants, or a combination of both.
	 *
	 * If no ancestor or descendants exist, return undefined.
	 *
	 * @param {TileCoord} ncoord - The normalized coord of the tile.
	 *
	 * @returns {Array} The array of tile partials that closest match the provided coord.
	 */
	getAvailableLOD(ncoord) {
		// check if we have the tile
		const tile = this.get(ncoord);
		if (tile) {
			// if exists, return it
			return [
				TilePartial.fromTile(tile)
			];
		}
		// if not, find the closest available level-of-detail

		// first, get the available levels of detail, ascending in distance
		// from the original coord zoom
		const zoom = ncoord.z;
		const levels = [];
		this.levels.forEach((_, key) => {
			if (key !== zoom) {
				levels.push(key);
			}
		});
		levels.sort((a, b) => {
			// give priority to ancestor levels since they are cheaper
			const da = (a > zoom) ? (a - zoom) : (zoom - a - 0.5);
			const db = (b > zoom) ? (b - zoom) : (zoom - b - 0.5);
			return da - db;
		});

		const results = [];
		const queue = [];
		let current = ncoord;
		let level = levels.shift();

		// second, iterate through available levels searching for the closest
		// level-of-detail for the current head of the queue
		while (current !== undefined && level !== undefined) {

			if (level < current.z) {
				// try to find ancestor
				const dist = current.z - level;
				const ancestor = this.getAncestor(current, dist);
				if (ancestor) {
					// tile found, create a tile partial from the ancestor
					results.push(
						TilePartial.fromAncestor(
							ncoord, // target
							ancestor, // tile
							current)); // relative
					// pop next coord to search off the queue
					current = queue.shift();
					continue;
				}
			} else {
				// descendant checks are much more expensive, so limit this
				// based on distance to the original coord zoom
				// NOTE: this distance calculation is safe because it is always
				// true that "current.z >= zoom" because only descendant coords
				// are appended to the queue.
				// therefore in the case that "level >= current.z", then
				// "level >= zoom" must be true as well.
				const ndist = level - zoom;
				if (ndist < MAX_DESCENDENT_DIST) {
					// try to find descendant
					const dist = level - current.z;
					const descendants = this.getDescendants(current, dist);
					if (descendants) {
						for (let j=0; j<descendants.length; j++) {
							const descendant = descendants[j];
							if (descendant.coord) {
								// tile found,  create a tile partial from the
								// descendant
								results.push(
									TilePartial.fromDescendant(
										ncoord, // target
										descendant)); // tile
							} else {
								// no tile found, descendant is a coord
								queue.push(descendant);
							}
							continue;
						}
						current = queue.shift();
					}
				}
			}
			// nothing found in level, we can safely remove it from the search
			level = levels.shift();
		}
		return (results.length > 0) ? results : undefined;
	}
}

module.exports = TilePyramid;
