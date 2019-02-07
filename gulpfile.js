'use strict';

const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify');
const del = require('del');

const project = 'lumo';
const paths = {
	src: 'src/**/*.js',
	build: 'build'
};

function clean() {
	return del([ paths.build ]);
}

function lint() {
	return gulp.src(paths.src)
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
}

function buildDev() {
	return gulp.src(paths.src, { sourcemaps: true })
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(concat(`${project}.js`))
		.pipe(gulp.dest(paths.build));
}

function buildDist() {
	return gulp.src(paths.src, { sourcemaps: false })
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(uglify())
		.pipe(concat(`${project}.min.js`))
		.pipe(gulp.dest(paths.build));
}

const build = gulp.series(clean, lint, gulp.parallel(buildDev, buildDist));

exports.clean = clean;
exports.lint = lint;
exports.build = build;

exports.default = build;
