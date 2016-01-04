// Generated on 2015-09-02 using generator-jekyllized 0.7.3
"use strict";

var _ = require("lodash"),
    gulp = require("gulp"),
    gutil = require("gulp-util"),
    fs = require("fs"),
    path = require("path"),
    through2 = require("through2"),
    vinyl = require("vinyl"),
    browserify = require("browserify"),
    watchify = require("watchify"),
    shimify = require("browserify-shim"),
    babelify = require("babelify");

// Loads the plugins without having to list all of them, but you need
// to call them as $.pluginname
var $ = require("gulp-load-plugins")();
// "del" is used to clean out directories and such
var del = require("del");
// BrowserSync isn"t a gulp package, and needs to be loaded manually
var browserSync = require("browser-sync");
// merge is used to merge the output from two different streams into the same stream
var merge = require("merge-stream");
// Need a command for reloading webpages using BrowserSync
var reload = browserSync.reload;
// And define a variable that BrowserSync uses in it"s function
var bs;

// Deletes the directory that is used to serve the site during development
gulp.task("clean:dev", del.bind(null, ["_site"]));

// Deletes the directory that the optimized site is output to
gulp.task("clean:prod", del.bind(null, ["site"]));

// Runs the build command for Jekyll to compile the site locally
// This will build the site with the production settings
gulp.task("jekyll:dev", $.shell.task("jekyll build"));
gulp.task("jekyll-rebuild", ["jekyll:dev"], function () {
  reload;
});

// Almost identical to the above task, but instead we load in the build configuration
// that overwrites some of the settings in the regular configuration so that you
// don"t end up publishing your drafts or future posts
gulp.task("jekyll:prod", $.shell.task("jekyll build --config _config.yml,_config.build.yml"));

// Compiles the SASS files and moves them into the "assets/stylesheets" directory
gulp.task("styles", function () {
  // Looks at the style.scss file for what to include and creates a style.css file
  return gulp.src(["site/_scss/*.scss","!site/_scss/_*.scss"])
    .pipe($.plumber())
    .pipe($.sass({ includePaths: [
      "site/_scss",
      "site/components",
      "node_modules/bourbon/app/assets/stylesheets"] }))
    // AutoPrefix your CSS so it works between browsers
    .pipe($.autoprefixer("last 1 version", { cascade: true }))
    // Directory your CSS file goes to
    .pipe(gulp.dest("site/css/"))
    .pipe(gulp.dest("_site/css/"))
    // Outputs the size of the CSS file
    .pipe($.size({title: "styles"}))
    // Injects the CSS changes to your browser since Jekyll doesn"t rebuild the CSS
    .pipe(reload({stream: true}));
});

// Optimizes the images that exists
gulp.task("images", function () {
  return gulp.src("images/**")
    .pipe($.changed("_site/images"))
    .pipe($.imagemin({
      // Lossless conversion to progressive JPGs
      progressive: true,
      // Interlace GIFs for progressive rendering
      interlaced: true
    }))
    .pipe(gulp.dest("_site/images"))
    .pipe($.size({title: "images"}));
});

// Copy over fonts to the "site" directory
gulp.task("fonts", function () {
  return gulp.src("fonts/**")
    .pipe(gulp.dest("_site/fonts"))
    .pipe($.size({ title: "fonts" }));
});

// Copy xml and txt files to the "site" directory
gulp.task("copy", function () {
  return gulp.src(["_site/*.txt", "_site/*.xml"])
    .pipe(gulp.dest("site"))
    .pipe($.size({ title: "xml & txt" }))
});


// obsoleted https://truongtx.me/2015/06/07/gulp-with-browserify-and-watchify-updated/

function browserifyError(err) {
  gutil.log(gutil.colors.red('Error: '+err.message));
  this.end();
}


gulp.task('browserify', function() {
  return gulp
    .src(['_js/**/*.js','!**/_*.js','!*.spec.js'])
    // .pipe($.sourcemaps.init())
    .pipe(createBundler("dev"))
    //.pipe(gulpif(mode === "prod", uglify({mangle:false})));
    // .pipe($.sourcemaps.write('.'))
    .pipe($.rename(function(file) {
      file.dirname = '.';
    }))
    .pipe(gulp.dest('js/'))
    .pipe(gulp.dest('_site/js/'));
});

gulp.task('watchify', function() {
  return gulp
    .src(['_js/**/*.js','!**/_*.js','!*.spec.js'])
    // .pipe($.sourcemaps.init())
    .pipe(createBundler("watch"))
    //.pipe(gulpif(mode === "prod", uglify({mangle:false})));
    // .pipe($.sourcemaps.write('.'))
    .pipe($.rename(function(file) {
      file.dirname = '.';
    }))
    .pipe(gulp.dest('js/'))
    .pipe(gulp.dest('_site/js/'));
});

// Optimizes all the CSS, HTML and concats the JS etc
gulp.task("html", ["styles","browserify"], function () {
  var assets = $.useref.assets({searchPath: "_site"});

  return gulp.src("_site/**/*.html")
    .pipe(assets)
    // Concatenate JavaScript files and preserve important comments
    .pipe($.if("*.js", $.uglify({preserveComments: "some"})))
    // Minify CSS
    .pipe($.if("*.css", $.minifyCss()))
    // Start cache busting the files
    .pipe($.revAll({ ignore: [".eot", ".svg", ".ttf", ".woff"] }))
    .pipe(assets.restore())
    // Conctenate your files based on what you specified in _layout/header.html
    .pipe($.useref())
    // Replace the asset names with their cache busted names
    .pipe($.revReplace())
    // Minify HTML
    .pipe($.if("*.html", $.htmlmin({
      removeComments: true,
      removeCommentsFromCDATA: true,
      removeCDATASectionsFromCDATA: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true
    })))
    // Send the output to the correct folder
    .pipe(gulp.dest("_site"))
    .pipe($.size({title: "optimizations"}));
});


// Task to upload your site to your personal GH Pages repo
gulp.task("deploy", function () {
  // Deploys your optimized site, you can change the settings in the html task if you want to
  return gulp.src("./site/**/*")
    .pipe($.ghPages({
      // Currently only personal GitHub Pages are supported so it will upload to the master
      // branch and automatically overwrite anything that is in the directory
      branch: "master"
      }));
});

// Run JS Lint against your JS
gulp.task("jslint", function () {
  gulp.src("./_site/assets/javascript/*.js")
    // Checks your JS code quality against your .jshintrc file
    .pipe($.jshint(".jshintrc"))
    .pipe($.jshint.reporter());
});

// Runs "jekyll doctor" on your site to check for errors with your configuration
// and will check for URL errors a well
gulp.task("doctor", $.shell.task("jekyll doctor"));

// BrowserSync will serve our site on a local server for us and other devices to use
// It will also autoreload across all devices as well as keep the viewport synchronized
// between them.
gulp.task("serve:dev", ["styles", "browserify", "jekyll:dev"], function () {
  bs = browserSync({
    notify: true,
    // tunnel: "",
    server: {
      baseDir: "_site"
    }
  });
});

// These tasks will look for files that change while serving and will auto-regenerate or
// reload the website accordingly. Update or add other files you need to be watched.
gulp.task("watch", ["watchify"], function () {
  gulp.watch(["**/*.md", "**/*.html", "**/*.xml", "**/*.txt", "**/*.js", "!_site/**/*.*","!node_modules/**/*.*"], ["jekyll-rebuild"]);
  gulp.watch(["_site/css/*.css"], reload);
  gulp.watch(["site/_scss/**/*.scss"], ["styles"]);
  // gulp.watch(["_js/**/*.js"], ["browserify"]);
});

// Serve the site after optimizations to see that everything looks fine
gulp.task("serve:prod", function () {
  bs = browserSync({
    notify: false,
    // tunnel: true,
    server: {
      baseDir: "site"
    }
  });
});

// Default task, run when just writing "gulp" in the terminal
gulp.task("default", ["serve:dev", "watch"]);

// Checks your CSS, JS and Jekyll for errors
gulp.task("check", ["jslint", "doctor"], function () {
  // Better hope nothing is wrong.
});

// Builds the site but doesn"t serve it to you
gulp.task("build", ["jekyll:prod", "styles"], function () {});

// Builds your site with the "build" command and then runs all the optimizations on
// it and outputs it to "./site"
gulp.task("publish", ["build"], function () {
  gulp.start("html", "copy", "images", "fonts");
});


//
// create bundler
//
var browserifyConfig = {
  basedir: ".",
  paths: ["site/_js","./site/components"]
};

// caching for the next build (in watch task) instead of create new bundle
var cached = {};

// create browserify transform
function createBundler(mode) {

  var stream = through2.obj(function(file, enc, next) {
    var b;
    if(mode === "dev") {
      // debug: true for creating source map
      b = browserify(file, _.extend(browserifyConfig, {debug: true}));
    } else if(mode === 'prod') {
      b = browserify(file, browserifyConfig);
    } else if(mode === 'watch') {
      // for the next build of watchify, get the watchify instance out from
      // cached and build
      if(cached[file.path]) return cached[file.path].bundle();
      // create new watchify instance for the first build only
      b = watchify(browserify(file, _.extend(browserifyConfig, watchify.args, {debug: true})));
      cached[file] = b; // store it in cached
    }

    // event
    b.on('error', browserifyError);
    if(mode === 'watch') {
      b.on('time', function(time){gutil.log(gutil.colors.green('Browserify'), file.path, gutil.colors.blue('in ' + time + ' ms'));});
      /* ?? not sure if the task should be run again in this case
      b.on('update', function(){
        // on file changed, run the bundle again
        bundle(file, createBundler('watch'), 'watch');
      });
      */
    }

    // add each file to the bundle
    b.add(file.path);
    b.transform(babelify.configure({
      modules: "common",
      sourceMapRelative: __dirname
    }));
    // b.transform(shimify);
    b.bundle(function(err, src) {
      if (err) console.log(err);
      // create a new vinyl file with bundle contents
      // and push it to the stream
      stream.push(new vinyl({
        path: file.path.replace('/www/js', ''), // this path is relative to dest path
        contents: src
      }));
      next();
    });
  });

  return stream;
}
