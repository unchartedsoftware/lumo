(function() {

    'use strict';

    // https://github.com/arasatasaygin/is.js/blob/master/is.js

    const userAgent = (navigator && navigator.userAgent || '').toLowerCase();
    const vendor = (navigator && navigator.vendor || '').toLowerCase();

    const isFirefox = function() {
        return userAgent.match(/(?:firefox|fxios)\/(\d+)/);
    };

    const isChrome = function() {
        return /google inc/.test(vendor) ? userAgent.match(/(?:chrome|crios)\/(\d+)/) : null;
    };

    const isIE = function() {
        return userAgent.match(/(?:msie |trident.+?; rv:)(\d+)/);
    };

    const isEdge = function() {
        return userAgent.match(/edge\/(\d+)/);
    };

    const isOpera = function() {
        return userAgent.match(/(?:^opera.+?version|opr)\/(\d+)/);
    };

    const isSafari = function() {
        return userAgent.match(/version\/(\d+).+?safari/);
    };

    module.exports = {
        firefox: isFirefox(),
        chrome: isChrome(),
        ie: isIE(),
        edge: isEdge(),
        opera: isOpera(),
        safari: isSafari()
    };

}());
