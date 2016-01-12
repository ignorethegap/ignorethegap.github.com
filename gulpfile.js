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

var paths = require('./build/paths');


// deletes all files in the output path
gulp.task('clean', function() {
  return gulp.src([require('./build/paths').output])
    .pipe(require('vinyl-paths')(require('del')));
});

// runs eslint on all .js files
gulp.task('lint', function() {
  return gulp.src(require('./build/paths').source)
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failOnError());
});

var karma = require('karma').server;

/**
 * Run test once and exit
 */
gulp.task('test', function (done) {
    karma.start({
        configFile: __dirname + 'build/karma.conf.js',
        singleRun: true
    }, done);
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tdd', function (done) {
    karma.start({
        configFile: __dirname + 'build/karma.conf.js'
    }, done);
});

/**
 * Run test once with code coverage and exit
 */
gulp.task('cover', function (done) {
    karma.start({
        configFile: __dirname + 'build/karma.conf.js',
        singleRun: true,
        reporters: ['coverage'],
        preprocessors: {
          'test/**/*.js': ['babel'],
          'src/**/*.js': ['babel', 'coverage']
        },
        coverageReporter: {
          type: 'html',
          dir: 'build/reports/coverage'
        }
    }, done);
});


var webdriver_update = require('gulp-protractor').webdriver_update;
var protractor = require("gulp-protractor").protractor;

// for full documentation of gulp-protractor,
// please check https://github.com/mllrsohn/gulp-protractor
gulp.task('webdriver_update', webdriver_update);

// transpiles files in
// /test/e2e/src/ from es6 to es5
// then copies them to test/e2e/dist/
gulp.task('build-e2e', function () {
  return gulp.src(paths.e2eSpecsSrc)
    .pipe($.plumber())
    .pipe($.babel())
    .pipe(gulp.dest(paths.e2eSpecsDist));
});

// runs build-e2e task
// then runs end to end tasks
// using Protractor: http://angular.github.io/protractor/
gulp.task('e2e', ['webdriver_update', 'build-e2e'], function(cb) {
  return gulp.src(paths.e2eSpecsDist + "/*.js")
    .pipe(protractor({
        configFile: "build/protractor.conf.js",
        args: ['--baseUrl', 'http://127.0.0.1:9000']
    }))
    .on('error', function(e) { throw e; });
});


// this task utilizes the browsersync plugin
// to create a dev server instance
// at http://localhost:9000
gulp.task('serve', ['build'], function(done) {
  browserSync({
    online: false,
    open: false,
    port: 9000,
    server: {
      baseDir: ['.'],
      middleware: function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      }
    }
  }, done);
});



// BUILD and WATCH

var compilerOptions = require('./build/babel-options');
var assign = Object.assign || require('object.assign');
var notify = require("gulp-notify");

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
    //TODO cssnano
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
