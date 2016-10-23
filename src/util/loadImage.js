'use strict';

/**
 * Issues a XHR and loads an Image.
 *
 * @param {String} url - The url.
 * @param {Function} done - The callback.
 */
module.exports = function(url, done) {
	const image = new Image();
	image.onload = () => {
		done(null, image);
	};
	image.onerror = (event) => {
		const err = `Unable to load image from URL: \`${event.path[0].currentSrc}\``;
		done(err, null);
	};
	image.crossOrigin = 'anonymous';
	image.src = url;
};
