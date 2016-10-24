'use strict';

const babel = require('babelify');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const del = require('del');
const eslint = require('gulp-eslint');
const gulp = require('gulp');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');
const source = require('vinyl-source-stream');
const uglify = require('gulp-uglify');

const project = 'lumo';
const paths = {
	root: 'src/exports.js',
	source: [ 'src/**/*.js' ],
	test: [ 'test/**/*.js' ],
	build: 'build'
};

function handleError(err) {
	console.error(err);
	this.emit('end');
}

function handleErrorTimeout(err) {
	console.error(err);
	setTimeout(() => {
		// set delay for full mocha error message
		this.emit('end');
	});
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
		presets: [ 'es2015' ]
	});
	return (minify) ? bundleMin(bundler, output) : bundle(bundler, output);
}

gulp.task('clean', () => {
	del.sync(paths.build);
});

gulp.task('lint', () => {
	return gulp.src(paths.source)
		.pipe(eslint())
		.pipe(eslint.format());
});

gulp.task('build-min-js', [ 'lint', 'clean' ], () => {
	return build(paths.root, `${project}.min.js`, true);
});

gulp.task('build-js',[ 'lint', 'clean' ], () => {
	return build(paths.root, `${project}.js`, false);
});

gulp.task('build',[ 'build-js', 'build-min-js' ], () => {
});

gulp.task('test', () => {
	return gulp.src(paths.source)
		.pipe(istanbul({
			includeUntested: true
		}))
		.pipe(istanbul.hookRequire())
		.on('finish', () => {
			return gulp.src(paths.test)
				.pipe(mocha({ reporter: 'list' })
					.on('error', handleErrorTimeout))
				.pipe(istanbul.writeReports());
		});
});

gulp.task('default', [ 'build' ], () => {
});
