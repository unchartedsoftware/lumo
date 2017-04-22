'use strict';

// https://github.com/arasatasaygin/is.js/blob/master/is.js

const userAgent = (navigator && navigator.userAgent || '').toLowerCase();
const vendor = (navigator && navigator.vendor || '').toLowerCase();

/**
 * Test if the browser is firefox.
 * @private
 *
 * @returns {Array} Whether or not the browser is firefox.
 */
const isFirefox = function() {
	return userAgent.match(/(?:firefox|fxios)\/(\d+)/);
};

/**
 * Test if the browser is chrome.
 * @private
 *
 * @returns {Array} Whether or not the browser is chrome.
 */
const isChrome = function() {
	return /google inc/.test(vendor) ? userAgent.match(/(?:chrome|crios)\/(\d+)/) : null;
};

/**
 * Test if the browser is internet explorer.
 * @private
 *
 * @returns {Array} Whether or not the browser is internet explorer.
 */
const isIE = function() {
	return userAgent.match(/(?:msie |trident.+?; rv:)(\d+)/);
};

/**
 * Test if the browser is edge.
 * @private
 *
 * @returns {Array} Whether or not the browser is edge.
 */
const isEdge = function() {
	return userAgent.match(/edge\/(\d+)/);
};

/**
 * Test if the browser is opera.
 * @private
 *
 * @returns {Array} Whether or not the browser is opera.
 */
const isOpera = function() {
	return userAgent.match(/(?:^opera.+?version|opr)\/(\d+)/);
};

/**
 * Test if the browser is safari.
 * @private
 *
 * @returns {Array} Whether or not the browser is safari.
 */
const isSafari = function() {
	return userAgent.match(/version\/(\d+).+?safari/);
};

module.exports = {

	/**
	 * Whether or not the browser is firefox.
	 * @constant {boolean}
	 */
	firefox: !!isFirefox(),

	/**
	 * Whether or not the browser is chrome.
	 * @constant {boolean}
	 */
	chrome: !!isChrome(),

	/**
	 * Whether or not the browser is ie.
	 * @constant {boolean}
	 */
	ie: !!isIE(),

	/**
	 * Whether or not the browser is edge.
	 * @constant {boolean}
	 */
	edge: !!isEdge(),

	/**
	 * Whether or not the browser is opera.
	 * @constant {boolean}
	 */
	opera: !!isOpera(),

	/**
	 * Whether or not the browser is safari.
	 * @constant {boolean}
	 */
	safari: !!isSafari()
};
