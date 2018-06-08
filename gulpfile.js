'use strict';

const babel = require('babelify');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const del = require('del');
const eslint = require('gulp-eslint');
const gulp = require('gulp');
const source = require('vinyl-source-stream');
const uglify = require('gulp-uglify');

const project = 'lumo';
const paths = {
	root: 'src/exports.js',
	source: [ 'src/**/*.js' ],
	build: 'build'
};

function logError(err) {
	if (err instanceof SyntaxError) {
		console.error('Syntax Error:');
		console.error(err.message);
		console.error(err.codeFrame);
	} else {
		console.error(err.message);
	}
}

function handleError(err) {
	logError(err);
	this.emit('end');
}

function bundle(bundler, output) {
	return bundler.bundle()
		.on('error', handleError)
		.pipe(source(output))
		.pipe(gulp.dest(paths.build));
}

function bundleMin(bundler, output) {
	return bundler.bundle()
		.on('error', handleError)
		.pipe(source(output))
		.pipe(buffer())
		.pipe(uglify().on('error', handleError))
		.pipe(gulp.dest(paths.build));
}

function build(root, output, minify) {
	let bundler = browserify(root, {
		debug: !minify,
		standalone: project
	}).transform(babel, {
		global: true,
		compact: true,
		presets: ['@babel/preset-env']
	});
	return (minify) ? bundleMin(bundler, output) : bundle(bundler, output);
}

gulp.task('clean', () => {
	del.sync(paths.build);
});

gulp.task('lint', () => {
	return gulp.src(paths.source)
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('build-min-js', [ 'lint', 'clean' ], () => {
	return build(paths.root, `${project}.min.js`, true);
});

gulp.task('build-js', [ 'lint', 'clean' ], () => {
	return build(paths.root, `${project}.js`, false);
});

gulp.task('build', [ 'build-js', 'build-min-js' ], () => {
});

gulp.task('default', [ 'build' ], () => {
});
