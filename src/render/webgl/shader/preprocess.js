'use strict';

const DEFINED = '__DEFINED__';

const DEFINE_REGEX = /#define\b/i;
const UNDEF_REGEX = /#undef\b/i;
const IF_REGEX = /#if\b/i;
const IFDEF_REGEX = /#ifdef\b/i;
const IFNDEF_REGEX = /#ifndef\b/i;
const ELSE_REGEX = /#else\b/i;
const ELIF_REGEX = /#elif\b/i;
const ENDIF_REGEX = /#endif\b/i;

const PARSE_DEFINE_REGEX = /#define\s+(\w+)(\s(\w*)?)?/i;
const PARSE_UNDEF_REGEX = /#undef\s+(\w+)/i;
const PARSE_IF_REGEX = /#if\s+\(?\s*(!?\s*\w+)\s*(==|!=|>=|<=|<|<|>)?\s*(\w*)\s*\)?/i;
const PARSE_IFDEF_REGEX = /#ifdef\s+(\w+)/i;
const PARSE_IFNDEF_REGEX = /#ifndef\s+(\w+)/i;
const PARSE_ELIF_REGEX = /#elif\s+\(?\s*(!?\s*\w+)\s*(==|!=|>=|<=|<|<|>)?\s*(\w*)\s*\)?/i;
const REMAINING_REGEX = /#([\W\w\s\d])(?:.*\\r?\n)*.*$/gm;

const evalIf = function(a, logic, b) {
	if (logic === undefined) {
		if (a[0] === '!') {
			return !(a === 'true' || a >= 1);
		}
		return a === 'true' || a >= 1;
	}
	switch (logic) {
		case '==':
			return a === b;
		case '!=':
			return a !== b;
		case '>':
			return a > b;
		case '>=':
			return a >= b;
		case '<':
			return a < b;
		case '<=':
			return a <= b;
	}
	throw `Unrecognized logical operator \`${logic}\``;
};

class Conditional {
	constructor(type, conditional) {
		this.type = type;
		this.conditional = conditional.trim();
		this.body = [];
		this.children = [];
	}
	eval() {
		let parsed;
		switch (this.type) {
			case 'if':
				parsed = PARSE_IF_REGEX.exec(this.conditional);
				return evalIf(parsed[1], parsed[2], parsed[3]);
			case 'ifdef':
				parsed = PARSE_IFDEF_REGEX.exec(this.conditional);
				return parsed[1] === DEFINED;
			case 'ifndef':
				parsed = PARSE_IFNDEF_REGEX.exec(this.conditional);
				return parsed[1] !== DEFINED;
			case 'elif':
				parsed = PARSE_ELIF_REGEX.exec(this.conditional);
				return evalIf(parsed[1], parsed[2], parsed[3]);
		}
		throw `Unrecognized conditional type \`${this.type}\``;
	}
}

class Block {
	constructor(type, conditional, lineNum) {
		this.if = new Conditional(type, conditional);
		this.elif = [];
		this.else = null;
		this.parent = null;
		this.current = this.if;
		this.startLine = lineNum;
		this.endLine = null;
	}
	addElse(conditional) {
		this.current = new Conditional('else', conditional);
		this.else = this.current;
	}
	addElif(conditional) {
		this.current = new Conditional('elif', conditional);
		this.elif.push(this.current);
	}
	addBody(line, lineNum) {
		this.current.body.push({
			string: line.trim(),
			line: lineNum
		});
	}
	nest(block) {
		block.parent = this;
		this.current.children.push(block);
	}
	extract() {
		// #if
		let body = [];
		if (this.if.eval()) {
			body = body.concat(this.if.body);
			this.if.children.forEach(child => {
				body = body.concat(child.extract());
			});
			return body;
		}
		// #elif
		for (let i=0; i<this.elif.length; i++) {
			const elif = this.elif[i];
			if (elif.eval()) {
				body = body.concat(elif.body);
				for (let j=0; j<elif.children.length; j++) {
					const child = elif.children[j];
					body = body.concat(child.extract());
				}
				return body;
			}
		}
		// #else
		if (this.else) {
			body = body.concat(this.else.body);
			this.else.children.forEach(child => {
				body = body.concat(child.extract());
			});
			return body;
		}
		return [];
	}
	eval() {
		// ensure extract text is ordered correctly
		return this.extract().sort((a, b) => {
			return a.line - b.line;
		}).map(arg => {
			return arg.string;
		}).join('\n');
	}
}

const parseLines = function(lines) {

	const blocks = [];
	let current = null;

	lines.forEach((line, index) => {

		if (line.match(IF_REGEX)) {
			// #if
			const block = new Block('if', line, index);
			if (!current) {
				blocks.push(block);
			} else {
				current.nest(block);
			}
			current = block;

		} else if (line.match(IFDEF_REGEX)) {
			// #ifdef
			const block = new Block('ifdef', line, index);
			if (!current) {
				blocks.push(block);
			} else {
				current.nest(block);
			}
			current = block;

		} else if (line.match(IFNDEF_REGEX)) {
			// #ifndef
			const block = new Block('ifndef', line, index);
			if (!current) {
				blocks.push(block);
			} else {
				current.nest(block);
			}
			current = block;

		} else if (line.match(ELIF_REGEX)) {
			// #elif
			if (!current) {
				throw 'Invalid preprocessor syntax, unexpected `#elif`';
			}
			current.addElif(line);

		} else if (line.match(ELSE_REGEX)) {
			// #else
			if (!current) {
				throw 'Invalid preprocessor syntax, unexpected `#else`';
			}
			current.addElse(line);

		} else if (line.match(ENDIF_REGEX)) {
			// #endif
			if (!current) {
				throw 'Invalid preprocessor syntax, unexpected `#endif`';
			}
			current.endLine = index;
			current = current.parent;

		} else {
			// other
			if (current) {
				current.addBody(line, index);
			}
		}
	});

	if (current) {
		throw 'Invalid preprocessor syntax, missing expected `#endif`';
	}

	return blocks;
};

const replaceDefines = function(lines) {
	const defines = new Map();
	const replaced = [];
	lines.forEach(line => {
		if (line.match(DEFINE_REGEX)) {
			// #define
			const parsed = PARSE_DEFINE_REGEX.exec(line);
			defines.set(parsed[1], parsed[2] || DEFINED);

		} else if (line.match(UNDEF_REGEX)) {
			// #undef
			const parsed = PARSE_UNDEF_REGEX.exec(line);
			defines.delete(parsed[1]);

		} else if (line.match(IFDEF_REGEX)) {
			// #ifdef
			const parsed = PARSE_IFDEF_REGEX.exec(line);
			if (defines.has(parsed[1])) {
				line = line.replace(parsed[1], DEFINED);
			}
			replaced.push(line);

		} else if (line.match(IFNDEF_REGEX)) {
			// #ifndef
			const parsed = PARSE_IFNDEF_REGEX.exec(line);
			if (defines.has(parsed[1])) {
				line = line.replace(parsed[1], DEFINED);
			}
			replaced.push(line);

		} else {
			// swap defines
			defines.forEach((val, define) => {
				line = line.replace(define, val);
			});
			replaced.push(line);
		}
	});
	return replaced;
};

/**
 * Evaluates GLSL preprocessor statements.
 * NOTE: assumes comments have been stripped, and preprocessors are valid.
 *
 *     Supported:
 *
 *         #define (substitutions only)
 *         #undef
 *         #if (== and != comparisons only)
 *         #ifdef
 *         #ifndef
 *         #elif
 *         #else
 *         #endif
 *
 *     Not Supported:
 *
 *         #define (macros)
 *         #if (&& and || operators, defined() predicate)
 *         #error
 *         #pragma
 *         #extension
 *         #version
 *         #line
 *
 * @param {String} glsl - The glsl source code.
 *
 * @return {String} The processed glsl source code.
 */
module.exports = function(glsl) {
	// split lines
	let lines = glsl.split('\n');
	// replace any defines with their values
	lines = replaceDefines(lines);
	// parse them
	const blocks = parseLines(lines);
	// remove blocks in reverse order to preserve line numbers
	for (let i=blocks.length - 1; i>=0; i--) {
		const block = blocks[i];
		const replacement = block.eval();
		if (replacement.length > 0) {
			lines.splice(block.startLine, block.endLine - block.startLine + 1, replacement);
		} else {
			lines.splice(block.startLine, block.endLine - block.startLine + 1);
		}
	}
	// strip remaining unsupported preprocessor statements
	return lines.join('\n').replace(REMAINING_REGEX, '');
};
