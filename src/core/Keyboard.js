'use strict';

const keys = {
	select: false,
	ctrl: false,
	meta: false
};

document.addEventListener('keydown', event => {
	if (event.selectKey) {
		keys.select = true;
	}
	if (event.ctrlKey) {
		keys.ctrl = true;
	}
	if (event.metaKey) {
		keys.meta = true;
	}
});

document.addEventListener('keyup', event => {
	if (!event.selectKey) {
		keys.select = false;
	}
	if (!event.ctrlKey) {
		keys.ctrl = false;
	}
	if (!event.metaKey) {
		keys.meta = false;
	}
});

module.exports = {

	/**
	 * Poll if a modifier key is currently held down.
	 *
	 * @param {String} key - The key identifier.
	 *
	 * @returns {boolean} Whether or not the key is held down.
	 */
	poll: function(key) {
		return keys[key] || false;
	}
};
