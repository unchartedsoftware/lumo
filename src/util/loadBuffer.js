'use strict';

/**
 * Issues a XHR and loads an ArrayBuffer.
 *
 * @param {String} url - The url.
 * @param {Function} done - The callback.
 */
module.exports = function(url, done) {
	const req = new XMLHttpRequest();
	req.open('GET', url, true);
	req.responseType = 'arraybuffer';
	req.onload = () => {
		const arraybuffer = req.response;
		if (arraybuffer) {
			done(null, arraybuffer);
		} else {
			const err = `Unable to load ArrayBuffer from URL: \`${event.path[0].currentSrc}\``;
			done(err, null);
		}
	};
	req.onerror = (event) => {
		const err = `Unable to load ArrayBuffer from URL: \`${event.path[0].currentSrc}\``;
		done(err, null);
	};
	req.withCredentials = true;
	req.send(null);
};
