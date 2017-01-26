'use strict';

const assert = require('assert');
const preprocess = require('../../../../src/render/webgl/shader/preprocess');

describe('preprocess', () => {
	it('should correctly substitute `#define` statements', () => {
		const source = `
			#define TEST_0 0
			#define TEST_1 1
			#define TEST_2 text
			TEST_0
			TEST_1
			TEST_2
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 5); // includes first / last empty lines
		assert(evaluated[1].trim() === '0');
		assert(evaluated[2].trim() === '1');
		assert(evaluated[3].trim() === 'text');
	});
	it('should undefine previous `#define` statements with `#undef`', () => {
		const source = `
			#define TEST 0
			#undef TEST
			TEST
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 3); // includes first / last empty lines
		assert(evaluated[1].trim() === 'TEST');
	});
	it('should evaluate basic #if N expressions', () => {
		const source = `
			#define TEST_1 1
			#define TEST_TRUE true
			#if TEST_1
				1
			#endif
			#if TEST_TRUE
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 4); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
		assert(evaluated[2].trim() === '2');
	});
	it('should evaluate basic #if !N expressions', () => {
		const source = `
			#define TEST_0 0
			#define TEST_FALSE false
			#if !TEST_0
				1
			#endif
			#if !TEST_FALSE
				2
			#endif
			#if !TEST_MISSING
				3
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 5); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
		assert(evaluated[2].trim() === '2');
		assert(evaluated[3].trim() === '3');
	});
	it('should evaluate basic #if N == M expressions', () => {
		const source = `
			#define TEST 1
			#if (TEST == 1)
				1
			#endif
			#if TEST == 2
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 3); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
	});
	it('should evaluate basic #if N != M expressions', () => {
		const source = `
			#define TEST 2
			#if TEST != 1
				1
			#endif
			#if (TEST != 2)
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 3); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
	});
	it('should evaluate basic #if N > M expressions', () => {
		const source = `
			#define TEST_0 0
			#define TEST_1 1
			#if (TEST_0 > 0)
				1
			#endif
			#if TEST_1 > 0
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 3); // includes first / last empty lines
		assert(evaluated[1].trim() === '2');
	});
	it('should evaluate basic #if N >= M expressions', () => {
		const source = `
			#define TEST_0 0
			#define TEST_1 1
			#define TEST_2 2
			#if (TEST_0 >= 1)
				1
			#endif
			#if (TEST_1 >= 1)
				2
			#endif
			#if TEST_2 >= 1
				3
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 4); // includes first / last empty lines
		assert(evaluated[1].trim() === '2');
		assert(evaluated[2].trim() === '3');
	});
	it('should evaluate basic #if N < M expressions', () => {
		const source = `
			#define TEST_0 0
			#define TEST_1 1
			#if (TEST_0 < 1)
				1
			#endif
			#if TEST_1 < 1
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 3); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
	});
	it('should evaluate basic #if N <= M expressions', () => {
		const source = `
			#define TEST_0 0
			#define TEST_1 1
			#define TEST_2 2
			#if (TEST_0 <= 1)
				1
			#endif
			#if (TEST_1 <= 1)
				2
			#endif
			#if TEST_2 <= 1
				3
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 4); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
		assert(evaluated[2].trim() === '2');
	});
	it('should evaluate #ifdef conditionals', () => {
		const source = `
			#define TEST_0
			#define TEST_1 0
			#ifdef TEST_0
				0
			#endif
			#ifdef TEST_1
				1
			#endif
			#ifdef TEST_2
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 4); // includes first / last empty lines
		assert(evaluated[1].trim() === '0');
		assert(evaluated[2].trim() === '1');
	});
	it('should evaluate #ifndef conditionals', () => {
		const source = `
			#define TEST_0
			#define TEST_1 1
			#ifndef TEST_0
				0
			#endif
			#ifndef TEST_1
				1
			#endif
			#ifndef TEST_2
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 3); // includes first / last empty lines
		assert(evaluated[1].trim() === '2');
	});

	it('should evaluate basic #elif N expressions', () => {
		const source = `
			#define TEST_1 1
			#define TEST_TRUE true
			#define TEST_FALSE false
			#if TEST_FALSE
			#elif TEST_1
				1
			#endif
			#if TEST_FALSE
			#elif TEST_TRUE
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 4); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
		assert(evaluated[2].trim() === '2');
	});
	it('should evaluate basic #elif !N expressions', () => {
		const source = `
			#define TEST_0 0
			#define TEST_FALSE false
			#if TEST_FALSE
			#elif !TEST_0
				1
			#endif
			#if TEST_FALSE
			#elif !TEST_FALSE
				2
			#endif
			#if TEST_FALSE
			#elif !TEST_MISSING
				3
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 5); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
		assert(evaluated[2].trim() === '2');
		assert(evaluated[3].trim() === '3');
	});
	it('should evaluate basic #elif N == M expressions', () => {
		const source = `
			#define TEST 2
			#if (TEST == 0)
				0
			#elif (TEST == 1)
				1
			#elif TEST == 2
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 3); // includes first / last empty lines
		assert(evaluated[1].trim() === '2');
	});
	it('should evaluate #elif N != M expressions', () => {
		const source = `
			#define TEST 0
			#if (TEST != 0)
				0
			#elif (TEST != 1)
				1
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 3); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
	});
	it('should evaluate basic #elif N > M expressions', () => {
		const source = `
			#define TEST 2
			#if (TEST == 0)
				0
			#elif (TEST > 1)
				1
			#endif
			#if (TEST == 0)
				0
			#elif TEST > 2
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 3); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
	});
	it('should evaluate basic #elif N >= M expressions', () => {
		const source = `
			#define TEST 2
			#if (TEST == 0)
				0
			#elif (TEST >= 1)
				1
			#endif
			#if (TEST == 0)
				0
			#elif TEST >= 2
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 4); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
		assert(evaluated[2].trim() === '2');
	});
	it('should evaluate basic #elif N < M expressions', () => {
		const source = `
			#define TEST 1
			#if (TEST == 0)
				0
			#elif (TEST < 1)
				1
			#endif
			#if (TEST == 0)
				0
			#elif TEST < 2
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 3); // includes first / last empty lines
		assert(evaluated[1].trim() === '2');
	});
	it('should evaluate basic #elif N <= M expressions', () => {
		const source = `
			#define TEST 2
			#if (TEST == 0)
				0
			#elif (TEST <= 3)
				1
			#endif
			#if (TEST == 0)
				0
			#elif TEST <= 2
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 4); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
		assert(evaluated[2].trim() === '2');
	});
	it('should evaluate basic #else conditionals', () => {
		const source = `
			#define TEST 2
			#if (TEST == 0)
				0
			#elif TEST == 1
				1
			#else
				2
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 3); // includes first / last empty lines
		assert(evaluated[1].trim() === '2');
	});
	it('should evaluate nested blocks', () => {
		const source = `
			#define TEST_0 0
			#define TEST_1 1
			#if (TEST_0 == 0)
				a
				#if TEST_1 == 1
					b
				#endif
				c
			#endif
			#if (TEST_0 != 0)
			#elif TEST_0 == 0
				a
				#ifdef TEST_2
				#else
					b
				#endif
				c
				d
			#endif
			#if (TEST_0 != 0)
			#elif TEST_1 != 1
			#else
				a
				#ifndef TEST_2
					b
				#endif
				c
			#endif
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 12); // includes first / last empty lines
		assert(evaluated[1].trim() === 'a');
		assert(evaluated[2].trim() === 'b');
		assert(evaluated[3].trim() === 'c');
		assert(evaluated[4].trim() === 'a');
		assert(evaluated[5].trim() === 'b');
		assert(evaluated[6].trim() === 'c');
		assert(evaluated[7].trim() === 'd');
		assert(evaluated[8].trim() === 'a');
		assert(evaluated[9].trim() === 'b');
		assert(evaluated[10].trim() === 'c');
	});
	it('should support case insensitive preprocessor syntax', () => {
		const source = `
			#DEFINE TEST 0
			#IFDEF test
				0
			#else
				1
			#ENDIF
		`;
		const evaluated = preprocess(source).split('\n');
		assert(evaluated.length === 3); // includes first / last empty lines
		assert(evaluated[1].trim() === '1');
	});
});
