'use strict';

const assert = require('assert');
const parseShader = require('../../../../src/webgl/shader/parseShader');

describe('parseShader', () => {
	it('should return declarations in the order they are found in the source arguments', () => {
		const source =
			`
			attribute highp vec3 A;
			attribute highp vec3 B;
			attribute highp vec3 C;
			void main() {}
			`;
		const declarations = parseShader(source, 'attribute');
		assert(declarations[0].name === 'A');
		assert(declarations[1].name === 'B');
		assert(declarations[2].name === 'C');
	});
	it('should return the each unique declaration only once', () => {
		const sourceA =
			`
			attribute highp vec3 A;
			attribute highp vec3 A;
			uniform highp mat4 B;
			void main() {}
			`;
		const sourceB =
			`
			attribute highp vec3 A;
			uniform highp mat4 B;
			uniform highp mat4 C;
			void main() {}
			`;
		const declarations = parseShader([sourceA, sourceB], ['uniform', 'attribute']);
		assert(declarations[0].name === 'A');
		assert(declarations[1].name === 'B');
		assert(declarations[2].name === 'C');
	});
	it('should return an empty array if no qualifiers are passed', () => {
		const source =
			`
			attribute highp vec3 A;
			uniform highp mat4 B;
			uniform highp mat4 C;
			void main() {}
			`;
		let declarations = parseShader(source);
		assert(declarations.length === 0);
		declarations = parseShader(source, []);
		assert(declarations.length === 0);
	});
	it('should return an empty array if no source strings are passed', () => {
		let declarations = parseShader([]);
		assert(declarations.length === 0);
		declarations = parseShader();
		assert(declarations.length === 0);
	});
	it('should ignore comments', () => {
		const source =
			`
			// single line comment // uniform Bad1
			/* single line block comment uniform Bad2 */
			/* multi-line block
			   comment uniform Bad3 */
			   /*   random white ... attribute Bad3 ... space comment
			  across // uniform Bad4 / * multiple
			 lines*/attribute highp vec3 A;
			// /* */ nested attribute Bad5
			/*	*/  // after block attribute Bad6 / *
			uniform highp mat4 B;
			uniform highp mat4 C;
			void main() {}
			`;
		const declarations = parseShader(source, ['uniform', 'attribute']);
		assert(declarations[0].name === 'A');
		assert(declarations[1].name === 'B');
		assert(declarations[2].name === 'C');
	});
	it('should accept declarations broken across multiple lines', () => {
		const source =
			`
			attribute
			highp vec3
			A;
			uniform highp
			mat4 B
			;
			uniform highp mat4
			 C
			;
			void main() {}
			`;
		const declarations = parseShader(source, ['uniform', 'attribute']);
		assert(declarations[0].name === 'A');
		assert(declarations[1].name === 'B');
		assert(declarations[2].name === 'C');
	});
	it('should accept declarations using comma shorthand', () => {
		const source =
			`
			attribute highp vec3 A, B;
			uniform highp mat4 C,
			 D;
			uniform highp mat4 E
			   ,
			 F;
			void main() {}
			`;
		const declarations = parseShader(source, ['uniform', 'attribute']);
		assert(declarations[0].name === 'A');
		assert(declarations[1].name === 'B');
		assert(declarations[2].name === 'C');
		assert(declarations[3].name === 'D');
		assert(declarations[4].name === 'E');
		assert(declarations[5].name === 'F');
	});
	it('should parse source arguments in the order they are passed', () => {
		const sourceAB =
			`
			attribute highp vec3 A;
			uniform highp mat4 B;
			void main() {}
			`;
		const sourceCD =
			`
			attribute highp vec3 C;
			uniform highp mat4 D;
			void main() {}
			`;
		let declarations = parseShader([sourceAB, sourceCD], ['uniform', 'attribute']);
		assert(declarations[0].name === 'A');
		assert(declarations[1].name === 'B');
		assert(declarations[2].name === 'C');
		assert(declarations[3].name === 'D');
		declarations = parseShader([sourceCD, sourceAB], ['uniform', 'attribute']);
		assert(declarations[0].name === 'C');
		assert(declarations[1].name === 'D');
		assert(declarations[2].name === 'A');
		assert(declarations[3].name === 'B');
	});
	it('should not take into account what order the qualifer arguments are passed', () => {
		const source =
			`
			'attribute highp vec3 A;',
			'uniform highp mat4 B;',
			'uniform sampler2D C;',
			'void main() { ... }'].join('\n');
			`;
		let declarations = parseShader(source, ['uniform', 'attribute']);
		assert(declarations[0].name === 'A');
		assert(declarations[1].name === 'B');
		assert(declarations[2].name === 'C');
		declarations = parseShader(source, ['attribute', 'uniform']);
		assert(declarations[0].name === 'A');
		assert(declarations[1].name === 'B');
		assert(declarations[2].name === 'C');
	});
	it('should parse the count from array and non-array declarations', () => {
		const source =
			`
			uniform highp mat4 A[10], B, C [2];
			uniform highp mat4 D;
			float func() {
			return 5.0;
			}
			uniform highp mat4 E ,
			F
			[11] ;
			void main() {}
			`;
		const declarations = parseShader(source, ['uniform', 'attribute']);
		assert(declarations[0].count === 10);
		assert(declarations[1].count === 1);
		assert(declarations[2].count === 2);
		assert(declarations[3].count === 1);
		assert(declarations[4].count === 1);
		assert(declarations[5].count === 11);
	});
	it('should handle preprocessor statements', () => {
		const source =
			`
			precision highp float;
			#define TEST_0
			#DEFINE TEST_1 1

			#ifdef TEST_0
				uniform float uUniform;
			#else
				uniform vec4 uUniform;
			#ENDIF

			#if TEST_1 == 0
				uniform mat4 uOptionalUniform;
			#endif
			`;
		const declarations = parseShader(source, ['uniform', 'attribute']);
		assert(declarations.length === 1);
		assert(declarations[0].name === 'uUniform');
		assert(declarations[0].type === 'float');
	});
});
