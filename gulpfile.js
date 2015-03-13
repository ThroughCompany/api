/* =========================================================================
 * Dependencies
 * ========================================================================= */
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

var sh = require('shelljs');
var async = require('async');

require('gulp-task-list')(gulp);
/* =========================================================================
 * Default Task
 * ========================================================================= */
gulp.task('default');

/**
 * List gulp tasks
 */
gulp.task('?', function(next) {
  sh.exec('gulp task-list')
  next();
});
/* =========================================================================
 * Tests
 * ========================================================================= */
gulp.task('test', ['test-int'], function() {
  process.exit(0); //hacky shit because gulp doesn't exit - causes wercker to timeout
});

gulp.task('test-int', function() {
  return gulp.src('tests/integration/**/**/**-test.js')
    .pipe(mocha({
      reporter: 'spec'
    }));
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
