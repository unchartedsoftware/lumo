'use strict';

/**
 * Class representing a linked list.
 *
 * @private
 */
class LinkedList {

	/**
	 * Instantiates a new LinkedList object.
	 */
	constructor() {
		this.tail = null;
		this.head = null;
		this.length = 0;
	}

	/**
	 * Push an item to the end of the linked list.
	 *
	 * @param {*} item - The item to add.
	 *
	 * @returns {number} The new length of the list.
	 */
	push(item) {
		this.tail = new Node(item, this.tail, null, this);
		if (!this.head) {
			this.head = this.tail;
		}
		this.length++;
		return this.length;
	}

	/**
	 * Push an item to the front of the linked list.
	 *
	 * @param {*} item - The item to add.
	 *
	 * @returns {number} The new length of the list.
	 */
	unshift(item) {
		this.head = new Node(item, null, this.head, this);
		if (!this.tail) {
			this.tail = this.head;
		}
		this.length++;
		return this.length;
	}

	/**
	 * Remove an item front the end of the linked list.
	 *
	 * @returns {*} The removed value.
	 */
	pop() {
		if (!this.tail) {
			return undefined;
		}
		const res = this.tail.value;
		this.tail = this.tail.prev;
		if (this.tail) {
			this.tail.next = null;
		} else {
			this.head = null;
		}
		this.length--;
		return res;
	}

	/**
	 * Remove an item from the front of the linked list.
	 *
	 * @returns {*} The removed value.
	 */
	shift() {
		if (!this.head) {
			return undefined;
		}
		const res = this.head.value;
		this.head = this.head.next;
		if (this.head) {
			this.head.prev = null;
		} else {
			this.tail = null;
		}
		this.length--;
		return res;
	}

	/**
	 * Get an item at a particular index in the list.
	 *
	 * @param {number} n - The index of the element.
	 *
	 * @returns {*} The value.
	 */
	get(n) {
		let i;
		let node;
		for (i = 0, node = this.head; node !== null && i < n; i++) {
			// abort out of the list early if we hit a cycle
			node = node.next;
		}
		if (i === n && node !== null) {
			return node.value;
		}
	}

	/**
	 * Iterates over and executes the provided function for all values.
	 *
	 * @param {Function} fn - The function to execute on each value.
	 */
	forEach(fn) {
		for (let node = this.head, i = 0; node !== null; i++) {
			fn(node.value, i);
			node = node.next;
		}
	}

	/**
	 * Iterates over and executes the provided function for all values returning
	 * an array of all mapped values.
	 *
	 * @param {Function} fn - The function to execute on each tile.
	 *
	 * @returns {Array} The array of mapped values.
	 */
	map(fn) {
		const arr = new Array(this.length);
		for (let i = 0, node = this.head; node !== null; i++) {
			arr[i] = fn(node.value, i);
			node = node.next;
		}
		return arr;
	}

	/**
	 * Push a node to the end of the linked list.
	 *
	 * @param {Node} node - The node to add.
	 *
	 * @returns {number} The new length of the list.
	 */
	pushNode(node) {
		if (node === this.tail) {
			return;
		}
		if (node.list) {
			node.list.removeNode(node);
		}
		const tail = this.tail;
		node.list = this;
		node.prev = tail;
		if (tail) {
			tail.next = node;
		}
		this.tail = node;
		if (!this.head) {
			this.head = node;
		}
		this.length++;
		return this.length;
	}

	/**
	 * Push a node to the front of the linked list.
	 *
	 * @param {Node} node - The node to add.
	 *
	 * @returns {number} The new length of the list.
	 */
	unshiftNode(node) {
		if (node === this.head) {
			return;
		}
		if (node.list) {
			node.list.removeNode(node);
		}
		const head = this.head;
		node.list = this;
		node.next = head;
		if (head) {
			head.prev = node;
		}
		this.head = node;
		if (!this.tail) {
			this.tail = node;
		}
		this.length++;
		return this.length;
	}

	/**
	 * Remove a node from the linked list.
	 *
	 * @param {Node} node - The node to remove.
	 *
	 * @returns {number} The new length of the list.
	 */
	removeNode(node) {
		if (node.list !== this) {
			throw 'Removing node which does not belong to this list';
		}
		const next = node.next;
		const prev = node.prev;
		if (next) {
			next.prev = prev;
		}
		if (prev) {
			prev.next = next;
		}
		if (node === this.head) {
			this.head = next;
		}
		if (node === this.tail) {
			this.tail = prev;
		}
		node.list.length--;
		node.next = null;
		node.prev = null;
		node.list = null;
		return this.length;
	}
}

/**
 * Class representing a linked list node.
 *
 * @private
 */
class Node {

	/**
	 * Instantiates a new Node object.
	 *
	 * @param {*} value - The value of the node.
	 * @param {Node} prev - The previous node.
	 * @param {Node} next - The next node.
	 * @param {LinkedList} list - The linked list.
	 */
	constructor(value, prev, next, list) {
		this.list = list;
		this.value = value;
		if (prev) {
			prev.next = this;
			this.prev = prev;
		} else {
			this.prev = null;
		}
		if (next) {
			next.prev = this;
			this.next = next;
		} else {
			this.next = null;
		}
	}
}

module.exports = LinkedList;
