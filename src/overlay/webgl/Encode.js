'use strict';

// Constants

/**
 * High / low precision split.
 * @private
 * @constant {Number}
 */
const HI_LO_SPLIT = Math.pow(2, 24);

// Private Methods

const encHigh = function(num) {
	if (num >= 0) {
		return Math.floor(num / HI_LO_SPLIT);
	}
	return Math.ceil(num / HI_LO_SPLIT);
};

const encLow = function(num) {
	if (num >= 0) {
		return num % HI_LO_SPLIT;
	}
	return num % -HI_LO_SPLIT;
};

module.exports = {

	/**
	 * Encodes a the top 32 bits of a float64 values into a float32.
	 *
	 * @param {Number} - The float64 value.
	 *
	 * @returns {Number} The top 32 bits of the float64 value.
	 */
	encHigh: encHigh,

	/**
	 * Encodes a the lower 32 bits of a float64 values into a float32.
	 *
	 * @param {Number} - The float64 value.
	 *
	 * @returns {Number} The lower 32 bits of the float64 value.
	 */
	encLow: encLow,

	/**
	 * Encodes a 2-component vector of float64 values into a 4-component vector
	 * of float32 values.
	 *
	 * @param {Array} - The 2-component vector of float64 values.
	 *
	 * @returns {Float32Array} The resulting 4-component vector of float32 values.
	 */
	encodeVec2From64: function(vec) {
		const enc = new Array(4); //new Float32Array(4);
		enc[0] = encHigh(vec[0]);
		enc[1] = encHigh(vec[1]);
		enc[2] = encLow(vec[0]);
		enc[3] = encLow(vec[1]);
		return enc;
	},

	/**
	 * Encodes a float64 values into a 2-component vector of float32 values.
	 *
	 * @param {Array} - The float64 value.
	 *
	 * @returns {Float32Array} The resulting 2-component vector of float32 values.
	 */
	encodeFrom64: function(val) {
		const enc = new Array(2); //new Float32Array(2);
		enc[0] = encHigh(val);
		enc[1] = encLow(val);
		return enc;
	},

	/**
	 * GLSL source utility code for decoding float64 from two float32 components.
	 *
	 * @constant {String}
	 */
	decodeGLSL: `
		#define HI_LO_SPLIT       16777216.0
		#define HIGH_VEC2_64(arg) arg.xy
		#define LOW_VEC2_64(arg)  arg.zw
		#define HIGH_64(arg)      arg.x
		#define LOW_64(arg)       arg.y
		vec2 decodeVec2From64(vec4 v) {
			return vec2((v.xy * HI_LO_SPLIT) + v.zw);
		}
		float decodeFrom64(vec2 v) {
			return (v.x * HI_LO_SPLIT) + v.y;
		}
	`,

};
