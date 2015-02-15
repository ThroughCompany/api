/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');

var app = require('src');

/* =========================================================================
 * Constants
 * ========================================================================= */
var SYS_ADMIN_EMAIL = 'admin@throughcompany.com';
var SYS_ADMIN_PASSWORD = 'throughcompany'; //TODO: make this a harder password

/* =========================================================================
 * Run
 * ========================================================================= */
var Auth;
var User;
var Admin;

var authService;
var userService;
var adminService;

var logger;

app.init({
  http: false
}, function() {
  Auth = require('modules/auth/data/model');
  Admin = require('modules/admin/data/model');
  User = require('modules/user/data/model');

  authService = require('modules/auth');
  userService = require('modules/user');
  adminService = require('modules/admin');

  logger = require('modules/logger');

  async.waterfall([
    function lookForExistingSysAdminByEmail_step(done) {
      User.find({
        email: SYS_ADMIN_EMAIL
      }, done);
    },
    function createAdmin_step(users, done) {
      if (users && users.length) {
        logger.info('sys admin already exists, skipping...');
        return done(); // skip this step, sys admin already exists
      }

      logger.info('creating sys admin...');

      userService.createUsingCredentials({
        email: SYS_ADMIN_EMAIL,
        password: SYS_ADMIN_PASSWORD
      }, function(err, newUser) {
        if (err) return done(err);

        adminService.create({
          userId: newUser._id
        }, done);
      });
    }
  ], function() {
    process.exit(0);
  });
});
