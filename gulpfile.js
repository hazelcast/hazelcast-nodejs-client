'use strict';
var path = require('path');
var gulp = require('gulp');
var gulp = require('gulp-help')(gulp);
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
var exec = require('child_process').exec;
var jshint = require('gulp-jshint');
var gulpSequence = require('gulp-sequence');
var inject = require('gulp-inject');
var tsconfig = require('gulp-tsconfig-files');
var tslint = require('gulp-tslint');
var debug = require('gulp-debug');
var rimraf = require('rimraf');

var typeDefsPath = (function (tsd) {
    return tsd.path || 'typings';
})(require('./tsd.json'));

var tsFilesGlob = (function (c) {
    return c.filesGlob || c.files || '**/*.ts';
})(require('./tsconfig.json'));

gulp.task('gen_tsrefs', 'Generates the app.d.ts references file dynamically for all application *.ts files', function () {
    var target = gulp.src(path.join('.', typeDefsPath, 'app.d.ts'));
    var sources = gulp.src([path.join('.', 'src', '**', '*.ts')], {read: false});
    // sources.pipe(debug());
    // target.pipe(debug());
    var transformation = inject(sources, {
        starttag: '//{',
        endtag: '//}',
        transform: function (filepath) {
            console.log(filepath);
            return '/// <reference path="..' + filepath + '" />';
        }
    });
    return target
        .pipe(transformation)
        .pipe(gulp.dest(path.join('.', typeDefsPath)));
});

gulp.task('_build', 'INTERNAL TASK - Compiles all TypeScript source files', function (cb) {
    exec('tsc', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('tslint', 'Lints all TypeScript source files', function () {
    return gulp.src(tsFilesGlob)
        .pipe(tslint())
        .pipe(tslint.report('verbose'));
});

gulp.task('tsBuild', 'Compiles all TypeScript source files and updates module references', gulpSequence('tslint', 'gen_tsrefs', '_build'));


gulp.task('nsp', function (cb) {
    nsp({package: path.resolve('package.json')}, cb);
});

gulp.task('pre-test', function () {
    return gulp.src('lib/**/*.js')
        .pipe(istanbul({
            includeUntested: true
        }))
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function (cb) {
    var mochaErr;

    gulp.src('test/**/*.js')
        .pipe(plumber())
        .pipe(mocha({reporter: 'spec'}))
        .on('error', function (err) {
            mochaErr = err;
        })
        .pipe(istanbul.writeReports())
        .on('end', function () {
            cb(mochaErr);
        });
});

gulp.task('jshint', function () {
    return gulp
        .src('lib/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('clean', function(cb) {
    rimraf('lib', cb);
});
gulp.task('compile', ['tsBuild']);
gulp.task('default', gulpSequence('tsBuild', 'test'));

