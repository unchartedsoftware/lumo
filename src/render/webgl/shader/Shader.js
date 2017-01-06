'use strict';

const map = require('lodash/map');
const parseShader = require('./parseShader');

// Constants

const UNIFORM_FUNCTIONS = {
	'bool': 'uniform1i',
	'bool[]': 'uniform1iv',
	'float': 'uniform1f',
	'float[]': 'uniform1fv',
	'int': 'uniform1i',
	'int[]': 'uniform1iv',
	'uint': 'uniform1i',
	'uint[]': 'uniform1iv',
	'vec2': 'uniform2fv',
	'vec2[]': 'uniform2fv',
	'ivec2': 'uniform2iv',
	'ivec2[]': 'uniform2iv',
	'vec3': 'uniform3fv',
	'vec3[]': 'uniform3fv',
	'ivec3': 'uniform3iv',
	'ivec3[]': 'uniform3iv',
	'vec4': 'uniform4fv',
	'vec4[]': 'uniform4fv',
	'ivec4': 'uniform4iv',
	'ivec4[]': 'uniform4iv',
	'mat2': 'uniformMatrix2fv',
	'mat2[]': 'uniformMatrix2fv',
	'mat3': 'uniformMatrix3fv',
	'mat3[]': 'uniformMatrix3fv',
	'mat4': 'uniformMatrix4fv',
	'mat4[]': 'uniformMatrix4fv',
	'sampler2D': 'uniform1i',
	'samplerCube': 'uniform1i'
};

// Private Methods

const setAttributesAndUniforms = function(shader, vertSource, fragSource) {
	// parse shader delcarations
	const declarations = parseShader(
		[ vertSource, fragSource ],
		[ 'uniform', 'attribute' ]);
	// for each declaration in the shader
	declarations.forEach(declaration => {
		// check if its an attribute or uniform
		if (declaration.qualifier === 'attribute') {
			// if attribute, store type and index
			shader.attributes.set(declaration.name, {
				type: declaration.type,
				index: shader.attributes.size
			});
		} else { // if (declaration.qualifier === 'uniform') {
			// if uniform, store type and buffer function name
			const type = declaration.type + (declaration.count > 1 ? '[]' : '');
			shader.uniforms.set(declaration.name, {
				type: declaration.type,
				func: UNIFORM_FUNCTIONS[type]
			});
		}
	});
};

const compileShader = function(gl, shaderSource, type) {
	const shader = gl.createShader(gl[type]);
	gl.shaderSource(shader, shaderSource);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw `An error occurred compiling the shader:\n${gl.getShaderInfoLog(shader)}`;
	}
	return shader;
};

const bindAttributeLocations = function(shader) {
	const gl = shader.gl;
	shader.attributes.forEach((attribute, name) => {
		// bind the attribute location
		gl.bindAttribLocation(shader.program, attribute.index, name);
	});
};

const getUniformLocations = function(shader) {
	const gl = shader.gl;
	const uniforms = shader.uniforms;
	uniforms.forEach((uniform, name) => {
		// get the uniform location
		const location = gl.getUniformLocation(shader.program, name);
		// check if null, parse may detect uniform that is compiled out
		// due to a preprocessor evaluation.
		// TODO: fix parser so that it evaluates these correctly.
		if (location === null) {
			uniforms.delete(name);
		} else {
			uniform.location = location;
		}
	});
};

const createDefines = function(defines) {
	return map(defines, (value, name) => {
		return `#define ${name} ${value}`;
	}).join('\n');
};

const createProgram = function(shader, sources) {
	// Creates the shader program object from source strings. This includes:
	//	1) Compiling and linking the shader program.
	//	2) Parsing shader source for attribute and uniform information.
	//	3) Binding attribute locations, by order of delcaration.
	//	4) Querying and storing uniform location.
	const gl = shader.gl;
	const defines = createDefines(sources.define);
	const common = defines + (sources.common || '');
	const vert = common + sources.vert;
	const frag = common + sources.frag;
	// compile shaders
	const vertexShader = compileShader(gl, vert, 'VERTEX_SHADER');
	const fragmentShader = compileShader(gl, frag, 'FRAGMENT_SHADER');
	// parse source for attribute and uniforms
	setAttributesAndUniforms(shader, vert, frag);
	// create the shader program
	shader.program = gl.createProgram();
	// attach vertex and fragment shaders
	gl.attachShader(shader.program, vertexShader);
	gl.attachShader(shader.program, fragmentShader);
	// bind vertex attribute locations BEFORE linking
	bindAttributeLocations(shader);
	// link shader
	gl.linkProgram(shader.program);
	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shader.program, gl.LINK_STATUS)) {
		throw `An error occured linking the shader:\n${gl.getProgramInfoLog(shader.program)}`;
	}
	// get shader uniform locations
	getUniformLocations(shader);
};

/**
 * Class representing a shader program.
 */
class Shader {

	/**
	 * Instantiates a Shader object.
	 *
	 * @param {WebGLRenderingContext} gl - The WebGL context.
	 * @param {Object} params - The shader params object.
	 * @param {String} params.common - Common glsl to be shared by both vertex and fragment shaders.
	 * @param {String} params.vert - The vertex shader glsl.
	 * @param {String} params.frag - The fragment shader glsl.
	 * @param {Object} params.define - Any #define directives to include in the glsl.
	 */
	constructor(gl, params = {}) {
		// check source arguments
		if (!params.vert) {
			throw 'Vertex shader argument `vert` has not been provided';
		}
		if (!params.frag) {
			throw 'Fragment shader argument `frag` has not been provided';
		}
		this.gl = gl;
		this.program = null;
		this.attributes = new Map();
		this.uniforms = new Map();
		// create the shader program
		createProgram(this, params);
	}

	/**
	 * Binds the shader program for use.
	 *
	 * @return {Shader} The shader object, for chaining.
	 */
	use() {
		// use the shader
		this.gl.useProgram(this.program);
		return this;
	}

	/**
	 * Buffer a uniform value by name.
	 *
	 * @param {String} name - The uniform name in the shader source.
	 * @param {*} value - The uniform value to buffer.
	 *
	 * @return {Shader} - The shader object, for chaining.
	 */
	setUniform(name, value) {
		const uniform = this.uniforms.get(name);
		// ensure that the uniform params exists for the name
		if (!uniform) {
			throw `No uniform found under name \`${name}\``;
		}
		// check value
		if (value === undefined || value === null) {
			// ensure that the uniform argument is defined
			throw `Value passed for uniform \`${name}\` is undefined or null`;
		}
		// set the uniform
		// NOTE: checking type by string comparison is faster than wrapping
		// the functions.
		if (uniform.type === 'mat2' || uniform.type === 'mat3' || uniform.type === 'mat4') {
			this.gl[uniform.func](uniform.location, false, value);
		} else {
			this.gl[uniform.func](uniform.location, value);
		}
		return this;
	}
}

module.exports = Shader;
