(function() {

    'use strict';

    const babel = require('babelify');
    const browserify = require('browserify');
    const buffer = require('vinyl-buffer');
    const concat = require('gulp-concat');
    const csso = require('gulp-csso');
    const del = require('del');
    const gulp = require('gulp');
    const istanbul = require('gulp-istanbul');
    const jshint = require('gulp-jshint');
    const mocha = require('gulp-mocha');
    const runSequence = require('run-sequence');
    const source = require('vinyl-source-stream');

    const project = 'caleida';
    const paths = {
        root: 'webapp/app.js',
        index: 'webapp/index.html',
        style: [ 'webapp/**/*.css' ],
        source: [ 'src/**/*.js', 'webapp/app.js' ],
        test: [ 'test/**/*.js' ],
        build: 'build'
    };

    function handleError(err) {
        console.log(err);
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
            .pipe(jshint('.jshintrc'))
            .pipe(jshint.reporter('jshint-stylish'));
    });

    gulp.task('build-source', () => {
        return browserify(paths.root, {
                debug: true,
                standalone: project
            }).transform(babel, {
                presets: [ 'es2015' ]
            })
            .bundle()
            .on('error', handleError)
            .pipe(source(project + '.js'))
            .pipe(buffer())
            .pipe(gulp.dest(paths.build));
    });

    gulp.task('build-styles', () => {
        return gulp.src(paths.style)
            .pipe(csso())
            .pipe(concat(project + '.css'))
            .pipe(gulp.dest(paths.build));
    });

    gulp.task('copy-index', () => {
        return gulp.src(paths.index)
            .pipe(gulp.dest(paths.build));
    });

    gulp.task('build', done => {
        runSequence(
            [ 'clean', 'lint' ],
            [ 'build-source', 'build-styles' ],
            [ 'copy-index' ],
            done);
    });

    gulp.task('test', () => {
        return gulp.src(paths.source)
            .pipe(istanbul({ includeUntested: false }))
            .pipe(istanbul.hookRequire())
            .on('finish', () => {
                return gulp.src(paths.test)
                    .pipe(mocha({ reporter: 'list' })
                        .on('error', handleErrorTimeout))
                    .pipe(istanbul.writeReports());
            });
    });

    gulp.task('serve', () => {
        const express = require('express');
        const compression = require('compression');
        const app = express();
        const port = 8080;
        app.use(compression());
        app.use(express.static(__dirname + '/' + paths.build));
        app.listen(port, () => {
            console.log(`Listening on port ${port}`);
        });
        return app;
    });

    gulp.task('watch', [ 'build' ], () => {
        gulp.watch(paths.source, [ 'build-source' ]);
        gulp.watch(paths.style, [ 'build-styles' ]);
        gulp.watch(paths.index, [ 'copy-index' ]);
    });

    gulp.task('default', done => {
        runSequence(
            [ 'watch' ],
            [ 'serve' ],
            done);
    });

}());
