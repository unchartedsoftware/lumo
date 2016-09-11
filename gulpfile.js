(function() {

    'use strict';

    const babel = require('babelify');
    const browserify = require('browserify');
    const buffer = require('vinyl-buffer');
    const concat = require('gulp-concat');
    const csso = require('gulp-csso');
    const del = require('del');
    const gulp = require('gulp');
    const jshint = require('gulp-jshint');
    const runSequence = require('run-sequence');
    const source = require('vinyl-source-stream');

    const project = 'caleida';
    const paths = {
        root: 'webapp/app.js',
        index: 'webapp/index.html',
        source: [ 'src/**/*.js', 'webapp/app.js' ],
        styles: [ 'webapp/**/*.css' ],
        build: 'build'
    };

    function handleError(err) {
        console.log(err);
        this.emit('end');
    }

    gulp.task('clean', function() {
        del.sync(paths.build);
    });

    gulp.task('lint', function() {
        return gulp.src(paths.source)
            .pipe(jshint('.jshintrc'))
            .pipe(jshint.reporter('jshint-stylish'));
    });

    gulp.task('build-source', function() {
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

    gulp.task('build-styles', function () {
        return gulp.src(paths.styles)
            .pipe(csso())
            .pipe(concat(project + '.css'))
            .pipe(gulp.dest(paths.build));
    });

    gulp.task('copy-index', function() {
        return gulp.src(paths.index)
            .pipe(gulp.dest(paths.build));
    });

    gulp.task('build', function(done) {
        runSequence(
            [ 'clean', 'lint' ],
            [ 'build-source', 'build-styles' ],
            [ 'copy-index' ],
            done);
    });

    gulp.task('serve', function() {
        const express = require('express');
        const compression = require('compression');
        const app = express();
        const port = 8080;
        app.use(compression());
        app.use(express.static(__dirname + '/' + paths.build));
        app.listen(port, function() {
            console.log(`Listening on port ${port}`);
        });
        return app;
    });

    gulp.task('watch', [ 'build' ], function(done) {
        gulp.watch(paths.source, [ 'build-source' ]);
        gulp.watch(paths.styles, [ 'build-styles' ]);
        gulp.watch(paths.index, [ 'copy-index' ]);
        done();
    });

    gulp.task('default', function(done) {
        runSequence(
            [ 'watch' ],
            [ 'serve' ],
            done);
    });

}());
