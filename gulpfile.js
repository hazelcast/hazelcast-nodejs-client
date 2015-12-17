'use strict';
var path = require('path');
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
//var exec = require('child_process').exec;
var jshint = require('gulp-jshint');

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

/*gulp.task('startHazelcast', function (cb) {
    exec('java -showversion -cp "$PWD/hazelcast-all-3.6-EA2.jar:" com.hazelcast.core.server.StartServer', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        //cb(err);
    });
});*/

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


gulp.task('default', ['test']);
