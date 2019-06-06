'use strict';

const defaultTo = require('lodash/defaultTo');
const LinkedList = require('./LinkedList');

// Constants

/**
 * Max size symbol.
 * @private
 * @constant {Symbol}
 */
const CAPACITY = Symbol();

/**
 * Dispose function symbol.
 * @private
 * @constant {Symbol}
 */
const ON_REMOVE = Symbol();

/**
 * Cache symbol.
 * @private
 * @constant {Symbol}
 */
const CACHE = Symbol();

/**
 * LRU linked list symbol.
 * @private
 * @constant {Symbol}
 */
const LRU_LIST = Symbol();

/**
 * LRU length symbol.
 * @private
 * @constant {Symbol}
 */
const LENGTH = Symbol();

// Private Methods

const del = function(self, node) {
	if (node) {
		const hit = node.value;
		if (self[ON_REMOVE]) {
			self[ON_REMOVE](hit.value, hit.key);
		}
		self[LENGTH]--;
		self[CACHE].delete(hit.key);
		self[LRU_LIST].removeNode(node);
	}
};

/**
 * Class representing an LRU cache.
 * @private
 */
class LRUCache {

	/**
	 * Instantiates a new LRUCache object.
	 *
	 * @param {object} options - The options object.
	 * @param {number} options.capacity - The capacity of the cache.
	 * @param {Function} options.onRemove - A function to execute when a value is evicted.
	 */
	constructor(options = {}) {
		this[CAPACITY] = defaultTo(Math.max(1, options.capacity), 256);
		this[ON_REMOVE] = defaultTo(options.onRemove, null);
		this.clear();
	}

	/**
	 * Returns the capacity of the cache.
	 *
	 * @returns {number} - The capcity of the cache.
	 */
	getCapacity() {
		return this[CAPACITY];
	}

	/**
	 * Returns the length of the cache.
	 *
	 * @returns {number} - The length of the cache.
	 */
	getLength() {
		return this[LENGTH];
	}

	/**
	 * Iterates over and executes the provided function for all values.
	 * NOTE: Does not update recentness of the entries.
	 *
	 * @param {Function} fn - The function to execute on each value and key.
	 */
	forEach(fn) {
		for (let node = this[LRU_LIST].head; node !== null;) {
			const next = node.next;
			fn(node.value.value, node.value.key);
			node = next;
		}
	}

	/**
	 * Clears all entries in the cache.
	 */
	clear() {
		if (this[ON_REMOVE] && this[LRU_LIST]) {
			this[LRU_LIST].forEach(hit => {
				this[ON_REMOVE](hit.value, hit.key);
			});
		}
		this[CACHE] = new Map();
		this[LRU_LIST] = new LinkedList();
		this[LENGTH] = 0;
	}

	/**
	 * Set a value under the provided key, removing the previous entry if one
	 * exists.
	 *
	 * @param {string} key - The key string.
	 * @param {*} value - The value.
	 */
	set(key, value) {
		if (this[CACHE].has(key)) {
			// if we already have an entry
			const node = this[CACHE].get(key);
			const item = node.value;
			// execute onRemove for old value before evicting
			if (this[ON_REMOVE]) {
				this[ON_REMOVE](item.value, key);
			}
			// set the new value
			item.value = value;
			this.get(key);
			// no need to trim, since the length remained constant
			return;
		}
		// add new entry
		const hit = new Entry(key, value);
		this[LENGTH]++;
		this[LRU_LIST].unshift(hit);
		this[CACHE].set(key, this[LRU_LIST].head);
		// trim any old entry
		if (this[LENGTH] > this[CAPACITY]) {
			// delete oldest entry
			del(this, this[LRU_LIST].tail);
		}
	}

	/**
	 * Returns whether or not the entry is in the LRU cache under the provided
	 * key.
	 * NOTE: Does not update recentness of the entry.
	 *
	 * @param {string} key - The key string.
	 *
	 * @returns {boolean} Whether or not the key exists.
	 */
	has(key) {
		if (!this[CACHE].has(key)) {
			return false;
		}
		return true;
	}

	/**
	 * Returns the entry in the LRU cache under the provided key.
	 * NOTE: Updates the recentness of the entry.
	 *
	 * @param {string} key - The key string.
	 *
	 * @returns {*} The value in the cache.
	 */
	get(key) {
		const node = this[CACHE].get(key);
		if (node) {
			// update recentness
			this[LRU_LIST].unshiftNode(node);
			return node.value.value;
		}
		return undefined;
	}

	/**
	 * Returns the entry in the LRU cache under the provided key.
	 * NOTE: Does not update recentness of the entry.
	 *
	 * @param {string} key - The key string.
	 *
	 * @returns {*} The value in the cache.
	 */
	peek(key) {
		const node = this[CACHE].get(key);
		if (node) {
			return node.value.value;
		}
		return undefined;
	}

	/**
	 * Removes the entry in the LRU cache under the provided key.
	 *
	 * @param {string} key - The key string.
	 */
	delete(key) {
		del(this, this[CACHE].get(key));
	}
}

/**
 * Class representing an LRU cache entry.
 * @private
 */
class Entry {

	/**
	 * Instantiates a new Entry object.
	 *
	 * @param {string} key - The entry key.
	 * @param {*} value - The entry value.
	 */
	constructor(key, value) {
		this.key = key;
		this.value = value;
	}
}

module.exports = LRUCache;
