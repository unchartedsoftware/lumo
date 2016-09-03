(function() {

    'use strict';

    const gulp = require('gulp');
    const concat = require('gulp-concat');
    const source = require('vinyl-source-stream');
    const buffer = require('vinyl-buffer');
    const del = require('del');
    const jshint = require('gulp-jshint');
    const browserify = require('browserify');
    const csso = require('gulp-csso');
    const runSequence = require('run-sequence');
    const babel = require('babelify');

    const project = 'caleida';
    const basePath = 'webapp/';
    const paths = {
        root: basePath + 'app.js',
        scripts: [ basePath + 'scripts/**/*.js', basePath + 'app.js' ],
        styles: [ basePath + 'styles/**/*.css' ],
        html: [ basePath + 'html/**/*.html' ],
        index: [ basePath + 'index.html' ],
        build: 'build'
    };

    function handleError(err){
        console.log(err);
        this.emit('end');
    }

    gulp.task('clean', function(done) {
        del.sync(paths.build);
        done();
    });

    gulp.task('lint', function() {
        return gulp.src(paths.scripts)
            .pipe(jshint('.jshintrc'))
            .pipe(jshint.reporter('jshint-stylish'));
    });

    gulp.task('build-scripts', function() {
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

    gulp.task('build', function(done) {
        runSequence(
            [ 'clean', 'lint' ],
            [ 'build-scripts', 'build-styles' ],
            [ 'copy-index' ],
            done);
    });

    gulp.task('copy-index', function() {
        return gulp.src(paths.index)
            .pipe(gulp.dest(paths.build));
    });

    gulp.task('serve', function() {
        const express = require('express');
        const compression = require('compression');
        const app = express();
        const port = 8080;
        app.use(compression());
        app.use(express.static(__dirname + '/' + paths.build ));
        app.listen(port, function() {
            console.log('Listening on port %d', port);
        });
        return app;
    });

    gulp.task('watch', [ 'build' ], function(done) {
        gulp.watch(paths.scripts, [ 'build-scripts' ]);
        gulp.watch(paths.styles, [ 'build-styles' ]);
        gulp.watch(paths.index, [ 'copy-index' ]);
        done();
    });

    gulp.task('deploy', [ 'build' ], function() {
    });

    gulp.task('default', function(done) {
        runSequence(
            [ 'watch' ],
            [ 'serve' ],
            done);
    });

}());
