'use strict';

const babel = require('babelify');
const browserify = require('browserify');
const del = require('del');
const eslint = require('gulp-eslint');
const gulp = require('gulp');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');
const source = require('vinyl-source-stream');

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

gulp.task('clean', () => {
	del.sync(paths.build);
});

gulp.task('lint', () => {
	return gulp.src(paths.source)
		.pipe(eslint())
		.pipe(eslint.format());
});

gulp.task('build', [ 'lint', 'clean' ], () => {
	return browserify(paths.root, {
			debug: true,
			standalone: project
		}).transform(babel, {
			presets: [ 'es2015' ]
		})
		.bundle()
		.on('error', handleError)
		.pipe(source(`${project}.js`))
		.pipe(gulp.dest(paths.build));
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
