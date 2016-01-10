// Generated on 2015-09-02 using generator-jekyllized 0.7.3
"use strict";

var _ = require("lodash"),
    gulp = require("gulp"),
    gutil = require("gulp-util"),
    fs = require("fs"),
    path = require("path"),
    runSequence = require('run-sequence'),
    browserSync = require("browser-sync");

// Loads the plugins without having to list all of them, but you need
// to call them as $.pluginname
var $ = require("gulp-load-plugins")();

// Need a command for reloading webpages using BrowserSync
var reload = browserSync.reload;
// And define a variable that BrowserSync uses in it"s function


// deletes all files in the output path
gulp.task('clean', function() {
  return gulp.src([require('./build-paths').output])
    .pipe(require('vinyl-paths')(require('del')));
});

// runs eslint on all .js files
gulp.task('lint', function() {
  return gulp.src(require('./build-paths').source)
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failOnError());
});


// BUILD and WATCH

var changed = require('gulp-changed');
var plumber = require('gulp-plumber');
var to5 = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var paths = require('./build-paths');
var compilerOptions = require('./babel-options');
var assign = Object.assign || require('object.assign');
var notify = require("gulp-notify");
var browserSync = require('browser-sync');

// transpiles changed es6 files to SystemJS format
// the plumber() call prevents 'pipe breaking' caused
// by errors from other gulp plugins
// https://www.npmjs.com/package/gulp-plumber
gulp.task('build-system', function() {
  return gulp.src(paths.source)
    .pipe($.plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
    .pipe($.changed(paths.output, {extension: '.js'}))
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.babel(assign({}, compilerOptions, {modules: 'system'})))
    .pipe($.sourcemaps.write({includeContent: true}))
    .pipe(gulp.dest(paths.output));
});

// copies changed html files to the output directory
gulp.task('build-html', function() {
  return gulp.src(paths.html)
    .pipe($.changed(paths.output, {extension: '.html'}))
    .pipe(gulp.dest(paths.output));
});

// copies changed css files to the output directory
gulp.task('build-css', function() {
  return gulp.src(paths.css)
    .pipe($.changed(paths.output, {extension: '.css'}))
    .pipe(gulp.dest(paths.output))
    .pipe(browserSync.stream());
});

// this task calls the clean task (located
// in ./clean.js), then runs the build-system
// and build-html tasks in parallel
// https://www.npmjs.com/package/gulp-run-sequence
gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    ['build-system', 'build-html', 'build-css'],
    callback
  );
});


// outputs changes to files to the console
function reportChange(event) {
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
}

// this task wil watch for changes
// to js, html, and css files and call the
// reportChange method. Also, by depending on the
// serve task, it will instantiate a browserSync session
gulp.task('watch', ['serve'], function() {
  gulp.watch(paths.source, ['build-system', browserSync.reload]).on('change', reportChange);
  gulp.watch(paths.html, ['build-html', browserSync.reload]).on('change', reportChange);
  gulp.watch(paths.css, ['build-css']).on('change', reportChange);
  gulp.watch(paths.style, function() {
    return gulp.src(paths.style)
      .pipe(browserSync.stream());
  }).on('change', reportChange);
});
