'use strict';

const assert = require('assert');
const LRUCache = require('../../src/util/LRUCache');

describe('LRUCache', () => {

	describe('#constructor()', () => {
		it('should accept `capacity` and `onRemove` arguments', () => {
			const lru = new LRUCache({
				capacity: 100,
				onRemove: () => {}
			});
			assert(lru.getCapacity() === 100);
			assert(lru.getLength() === 0);
		});
		it('should set the min `capacity` to 1', () => {
			const lru = new LRUCache({
				capacity: 0
			});
			assert(lru.getCapacity() === 1);
		});
	});

	describe('#getCapacity()', () => {
		it('should return the capacity of the cache', () => {
			const lru = new LRUCache({
				capacity: 100,
			});
			assert(lru.getCapacity() === 100);
		});
	});

	describe('#getLength()', () => {
		it('should return the current length of the cache', () => {
			const lru = new LRUCache();
			lru.set('a', 'A');
			assert(lru.getLength() === 1);
			lru.set('b', 'B');
			assert(lru.getLength() === 2);
			lru.set('c', 'C');
			assert(lru.getLength() === 3);
		});
	});

	describe('#get()', () => {
		it('should return the argument under the key if it exists', () => {
			const lru = new LRUCache();
			lru.set('a', 'A');
			lru.set('b', 'B');
			lru.set('c', 'C');
			assert(lru.get('a') === 'A');
			assert(lru.get('b') === 'B');
			assert(lru.get('c') === 'C');
		});
		it('should return undefined if the argument does not exist', () => {
			const lru = new LRUCache({
				capacity: 2
			});
			lru.set('a', 'A');
			lru.set('b', 'B');
			lru.set('c', 'C');
			assert(lru.get('a') === undefined);
			assert(lru.get('b') === 'B');
			assert(lru.get('c') === 'C');
		});
		it('should update the recentness of the element', () => {
			const lru = new LRUCache({
				capacity: 2
			});
			lru.set('a', 'A');
			lru.set('b', 'B');
			lru.set('c', 'C');
			assert(lru.get('a') === undefined);
			assert(lru.get('b') === 'B');
			assert(lru.get('c') === 'C');
			lru.set('d', 'D');
			assert(lru.get('a') === undefined);
			assert(lru.get('b') === undefined);
			assert(lru.get('c') === 'C');
			assert(lru.get('d') === 'D');
		});
	});

	describe('#set()', () => {
		it('should add a value to the cache under the provided key', () => {
			const lru = new LRUCache();
			lru.set('a', 'A');
			lru.set('b', 'B');
			lru.set('c', 'C');
			assert(lru.get('a') === 'A');
			assert(lru.get('b') === 'B');
			assert(lru.get('c') === 'C');
		});
		it('should overwrite existing keys', () => {
			const lru = new LRUCache();
			lru.set('a', 0);
			lru.set('a', 1);
			lru.set('a', 2);
			assert(lru.get('a') === 2);
		});
		it('should execute the `onRemove` method when overwriting existing keys', () => {
			let count = 0;
			const lru = new LRUCache({
				onRemove: () => {
					count++;
				}
			});
			lru.set('a', 0);
			lru.set('a', 1);
			lru.set('a', 2);
			assert(lru.get('a') === 2);
			assert(count === 2);
		});
	});

	describe('#has()', () => {
		it('should return true if the element exists in the cache', () => {
			const lru = new LRUCache({
				capacity: 2
			});
			lru.set('a', 'A');
			lru.set('b', 'B');
			assert(lru.has('a') === true);
			assert(lru.has('b') === true);
			lru.set('c', 'C');
			assert(lru.has('a') === false);
			assert(lru.has('b') === true);
			assert(lru.has('c') === true);
			lru.set('d', 'D');
			assert(lru.has('a') === false);
			assert(lru.has('b') === false);
			assert(lru.has('c') === true);
			assert(lru.has('d') === true);
		});
		it('should not update the recentness of the element', () => {
			const lru = new LRUCache({
				capacity: 2
			});
			lru.set('a', 'A');
			lru.set('b', 'B');
			lru.has('a');
			lru.set('c', 'C');
			assert(lru.get('a') === undefined);
			assert(lru.get('b') === 'B');
			assert(lru.get('c') === 'C');
			lru.has('b');
			lru.set('d', 'D');
			assert(lru.get('a') === undefined);
			assert(lru.get('b') === undefined);
			assert(lru.get('c') === 'C');
			assert(lru.get('d') === 'D');
		});
	});

	describe('#delete()', () => {
		it('should delete the entry under the provided key', () => {
			const lru = new LRUCache();
			lru.set('a', 'A');
			lru.set('b', 'B');
			lru.set('c', 'C');
			lru.delete('b');
			assert(lru.get('a') === 'A');
			assert(lru.get('b') === undefined);
			assert(lru.get('c') === 'C');
		});
		it('should delete the entry under the provided key', () => {
			const disposed = {};
			const lru = new LRUCache({
				onRemove: (val, key) => {
					disposed[key] = val;
				}
			});
			lru.set('a', 'A');
			lru.set('b', 'B');
			lru.set('c', 'C');
			lru.delete('a');
			lru.delete('b');
			lru.delete('c');
			assert(disposed.a === 'A');
			assert(disposed.b === 'B');
			assert(disposed.c === 'C');
		});
		it('should do nothing if the key does not exist', () => {
			const lru = new LRUCache();
			lru.delete('a');
			assert(lru.getLength() === 0);
		});
	});

	describe('#clear()', () => {
		it('should clear the entire cache', () => {
			const lru = new LRUCache();
			lru.set('a', 'A');
			lru.set('b', 'B');
			lru.set('c', 'C');
			lru.clear();
			assert(lru.getLength() === 0);
			assert(lru.get('a') === undefined);
			assert(lru.get('b') === undefined);
			assert(lru.get('c') === undefined);
		});
	});

	describe('#forEach', () => {
		it('should iterate over the list executing the provided function in order of recentness', () => {
			const lru = new LRUCache();
			lru.set('c', 'C');
			lru.set('b', 'B');
			lru.set('a', 'A');
			const order = [];
			lru.forEach((val, key) => {
				order.push(val);
				assert(lru.peek(key) === val);
			});
			assert(order[0] === 'A');
			assert(order[1] === 'B');
			assert(order[2] === 'C');
		});
	});

	describe('#peek()', () => {
		it('should return the argument under the key without updating recentness', () => {
			const lru = new LRUCache({
				capacity: 2
			});
			lru.set('a', 'A');
			lru.set('b', 'B');
			assert(lru.peek('a') === 'A');
			lru.set('c', 'C');
			assert(lru.get('a') === undefined);
			assert(lru.get('b') === 'B');
			assert(lru.get('c') === 'C');
		});
		it('should return undefined if the no element exists under the key', () => {
			const lru = new LRUCache({
				capacity: 2
			});
			assert(lru.peek('a') === undefined);
		});
	});

});
