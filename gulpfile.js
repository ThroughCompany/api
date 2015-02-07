/* =========================================================================
 * Dependencies
 * ========================================================================= */
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

var shell = require('shelljs');
var async = require('async');

/* =========================================================================
 * Default Task
 * ========================================================================= */
gulp.task('default');

/* =========================================================================
 * Tests
 * ========================================================================= */
gulp.task('test', ['test-int']);

gulp.task('test-int', function() {
  return gulp.src('tests/integration/**/**/**-test.js', {
      read: false,
      ui: 'tdd',
    })
    .pipe(mocha({
      reporter: 'spec'
    }));
});

/* =========================================================================
 * Jshint
 * ========================================================================= */
gulp.task('jshint', function() {
  return gulp.src(['src/**/**/*.js']) //'app/**/**/*.js', 'tests/**/**/*.js', 'test/**/**/*.js', 'config/**/**/*.js', 'lib/**/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});
