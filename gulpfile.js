/* =========================================================================
 * Dependencies
 * ========================================================================= */
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

var sh = require('shelljs');
var async = require('async');
var childProcess = require('child_process');

require('gulp-task-list')(gulp);

/* =========================================================================
 * Constants
 * ========================================================================= */
var MOCHA_SETTINGS = {
  reporter: 'spec',
  growl: true,
  useColors: true,
  useInlineDiffs: true
};

/* =========================================================================
 * Default Task
 * ========================================================================= */
gulp.task('default');

/*
 * List gulp tasks
 */
gulp.task('?', function(next) {
  sh.exec('gulp task-list')
  next();
});
/* =========================================================================
 * Tests
 * ========================================================================= */
gulp.task('test', function(next) {
  sh.exec('gulp test-unit', function(code, output) {
    sh.exec('gulp test-int', function(code, output) {
      next();
    });
  });
});

gulp.task('test-int', function(next) {
  return gulp.src('tests/integration/**/**/**-test.js')
    .pipe(mocha(MOCHA_SETTINGS))
    .on('close', function(e) {
      process.exit(-1);
      next();
    });;
});

gulp.task('test-unit', function(next) {
  return gulp.src('tests/unit/**/**/**-test.js')
    .pipe(mocha(MOCHA_SETTINGS))
    .on('close', function(e) {
      process.exit(-1);
      next();
    });;
});

/* =========================================================================
 * Database
 * ========================================================================= */
gulp.task('db-seed', function() {
  sh.exec('node ./tools/scripts/db-seed');
});

gulp.task('db-clean', function() {
  sh.exec('node ./tools/scripts/db-clean');
});

/* =========================================================================
 * Jshint
 * ========================================================================= */
gulp.task('jshint', function() {
  return gulp.src(['src/**/**/*.js']) //'app/**/**/*.js', 'tests/**/**/*.js', 'test/**/**/*.js', 'config/**/**/*.js', 'lib/**/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});
