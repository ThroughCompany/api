/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');

var app = require('src');

var mongoose;

var appConfig;

var Auth;
var User;
var Admin;
var Role;
var Permission;

var authService;
var userService;
var adminService;

var logger;

/* =========================================================================
 * Db Seed
 * ========================================================================= */
var steps = [];

function dbClean(options, next) {
  console.log('--------------------------------------------\nRUNNING DB CLEAN STEPS...\n--------------------------------------------');

  runSteps(steps, function() {

    console.log('\n--------------------------------------------\nFINISHED RUNNING DB CLEAN STEPS...\n--------------------------------------------');

    next();
  });
}

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Steps
 * ========================================================================= */
steps.push(function loadDependencies_step(done) {
  appConfig = require('src/config/app-config');

  Auth = require('modules/auth/data/model');
  Admin = require('modules/admin/data/model');
  User = require('modules/user/data/model');
  Role = require('modules/role/data/model');
  Permission = require('modules/permission/data/model');

  authService = require('modules/auth');
  userService = require('modules/user');
  adminService = require('modules/admin');

  logger = require('modules/logger');



  mongoose = require('mongoose');

  done();
});

steps.push(function dropDatabase_step(done) {
  var conn = mongoose.createConnection(appConfig.db);

  conn.once('open', function() {
    conn.db.collectionNames(function(err, names) {
      if (err) return done(err);

      // if no errors then we have a collection drop the database
      conn.db.dropDatabase(function(err, result) {
        if (err) return done(err);

        console.log('MONGO DB DROPPED');

        done(err);
      });
    });
  });
});

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function runSteps(steps, next) {
  var newSteps = [];

  _.each(steps, function(step) {
    newSteps.push(function(done) {
      var fnName = functionName(step);
      var index = steps.indexOf(step) + 1;

      console.log('\n' + index + ') - ' + fnName + ' ---------------------');

      step(done);
    });
  });

  async.series(newSteps, next);
}

function functionName(fun) {
  var ret = fun.toString();
  ret = ret.substr('function '.length);
  ret = ret.substr(0, ret.indexOf('('));
  return ret;
}

/* =========================================================================
 * Run
 * ========================================================================= */
module.exports = {
  run: function(options, next) {
    app.init({
      http: false
    }, function() {
      dbClean(options, next);
    });
  }
};
