'use strict';

const assert = require('assert');
const LinkedList = require('../../src/util/LinkedList');

describe('LinkedList', () => {

	describe('#constructor()', () => {
		it('should instantiate a new object accepting no arguments', () => {
			const list = new LinkedList();
			assert(list.tail === null);
			assert(list.head === null);
			assert(list.length === 0);
		});
	});

	describe('#push', () => {
		it('should push an element to the end of the list', () => {
			const list = new LinkedList();
			list.push('a');
			list.push('b');
			list.push('c');
			assert(list.get(0) === 'a');
			assert(list.get(1) === 'b');
			assert(list.get(2) === 'c');
			assert(list.length === 3);
		});
	});

	describe('#unshift', () => {
		it('should push an element to the front of the list', () => {
			const list = new LinkedList();
			list.unshift('c');
			list.unshift('b');
			list.unshift('a');
			assert(list.get(0) === 'a');
			assert(list.get(1) === 'b');
			assert(list.get(2) === 'c');
			assert(list.length === 3);
		});
	});

	describe('#shift', () => {
		it('should remove an element from the front of the list', () => {
			const list = new LinkedList();
			list.push('a');
			list.push('b');
			list.push('c');
			const res = list.shift();
			assert(res === 'a');
			assert(list.get(0) === 'b');
			assert(list.get(1) === 'c');
			assert(list.length === 2);
		});
		it('should handle a single entry list', () => {
			const list = new LinkedList();
			list.push('a');
			const res = list.shift();
			assert(res === 'a');
		});
		it('should return undefined if there are no elements in the list', () => {
			const list = new LinkedList();
			const res = list.shift();
			assert(res === undefined);
		});
	});

	describe('#pop', () => {
		it('should remove an element from the end of the list', () => {
			const list = new LinkedList();
			list.push('a');
			list.push('b');
			list.push('c');
			const res = list.pop();
			assert(res === 'c');
			assert(list.get(0) === 'a');
			assert(list.get(1) === 'b');
			assert(list.length === 2);
		});
		it('should handle a single entry list', () => {
			const list = new LinkedList();
			list.push('a');
			const res = list.pop();
			assert(res === 'a');
		});
		it('should return undefined if there are no elements in the list', () => {
			const list = new LinkedList();
			const res = list.pop();
			assert(res === undefined);
		});
	});

	describe('#get', () => {
		it('should return the value at the provided index', () => {
			const list = new LinkedList();
			list.push('a');
			list.push('b');
			list.push('c');
			assert(list.get(0) === 'a');
			assert(list.get(1) === 'b');
			assert(list.get(2) === 'c');
		});
		it('should return undefined if there are no element at the provided index', () => {
			const list = new LinkedList();
			const res = list.get(0);
			assert(res === undefined);
		});
	});

	describe('#forEach', () => {
		it('should iterate over the list executing the provided function', () => {
			const list = new LinkedList();
			list.push('a');
			list.push('b');
			list.push('c');
			list.forEach((val, index) => {
				assert(list.get(index) === val);
			});
		});
	});

	describe('#map', () => {
		it('should map the list to an array, executing the provided function over each element', () => {
			const list = new LinkedList();
			list.push('a');
			list.push('b');
			list.push('c');
			const arr = list.map((val, index) => {
				return `${val}:${index}`;
			});
			assert(arr[0] === 'a:0');
			assert(arr[1] === 'b:1');
			assert(arr[2] === 'c:2');
		});
	});

	describe('#pushNode', () => {
		it('should move a node to the end of the list', () => {
			const list = new LinkedList();
			list.push('a');
			list.push('b');
			list.push('c');
			list.pushNode(list.head);
			assert(list.get(0) === 'b');
			assert(list.get(1) === 'c');
			assert(list.get(2) === 'a');
			assert(list.length === 3);
		});
		it('should handle detached nodes', () => {
			const list = new LinkedList();
			list.push('a');
			const node = list.head;
			list.removeNode(node);
			list.pushNode(node);
			assert(list.get(0) === 'a');
		});
		it('should do nothing if node is already the tail', () => {
			const list = new LinkedList();
			list.push('a');
			list.pushNode(list.tail);
			assert(list.get(0) === 'a');
		});
	});

	describe('#unshiftNode', () => {
		it('should move a node to the front of the list', () => {
			const list = new LinkedList();
			list.push('a');
			list.push('b');
			list.push('c');
			list.unshiftNode(list.tail);
			assert(list.get(0) === 'c');
			assert(list.get(1) === 'a');
			assert(list.get(2) === 'b');
			assert(list.length === 3);
		});
		it('should handle detached nodes', () => {
			const list = new LinkedList();
			list.push('a');
			const node = list.head;
			list.removeNode(node);
			list.unshiftNode(node);
			assert(list.get(0) === 'a');
		});
		it('should do nothing if node is already the head', () => {
			const list = new LinkedList();
			list.push('a');
			list.unshiftNode(list.head);
			assert(list.get(0) === 'a');
		});
	});

	describe('#removeNode', () => {
		it('should remove a node from the list', () => {
			const list = new LinkedList();
			list.push('a');
			list.push('b');
			list.push('c');
			list.removeNode(list.head);
			list.removeNode(list.tail);
			assert(list.get(0) === 'b');
			assert(list.length === 1);
		});
		it('should throw an exception if the node is not part of the list', () => {
			const list = new LinkedList();
			list.push('a');
			const node = list.head;
			list.removeNode(list.head);
			let threw = false;
			try {
				list.removeNode(node);
			} catch(e) {
				threw = true;
			}
			assert(threw);
		});
	});

});
