/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/integration/before-all');

var should = require('should');
var async = require('async');

var app = require('src');
var appConfig = require('src/config/app-config');

var testUtils = require('tests/lib/test-utils');

var userService = require('modules/user');
var authService = require('modules/auth');
var adminService = require('modules/admin');

var User = require('modules/user/data/model');
var Auth = require('modules/auth/data/model');
var Admin = require('modules/admin/data/model');

var agent;

/* =========================================================================
 * Before All
 * ========================================================================= */

before(function(done) {
  agent = require('tests/lib/agent').getAgent();

  done();
});

describe('api', function() {
  describe('user', function() {
    describe('GET - /users/{id}', function() {
      describe('when user is not authenticated', function() {
        it('should return a 401', function(done) {

          agent
            .get('/users/123')
            .end(function(err, response) {
              should.not.exist(err);
              should.exist(response);

              var error = response.body;
              should.exist(error);

              var status = response.status;
              status.should.equal(401);

              done();
            });
        });
      });

      describe('when user is trying to get another user and is not an admin', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;
        var auth = null;

        before(function(done) {
          async.series([
            function createUser_step(cb) {
              userService.createUsingCredentials({
                email: email,
                password: password
              }, function(err, _user) {
                if (err) return cb(err);

                user = _user;
                cb();
              });
            },
            function authenticateUser_step(cb) {
              authService.authenticateCredentials({
                email: email,
                password: password
              }, function(err, _auth) {
                if (err) return cb(err);

                auth = _auth;
                cb();
              });
            }
          ], done);
        });

        after(function(done) {
          User.remove({
            email: email
          }, done);
        });

        after(function(done) {
          Auth.remove({
            user: user._id
          }, done);
        });

        it('should return a 403', function(done) {
          agent
            .get('/users/123')
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);

              var error = response.body;
              should.exist(error);

              var status = response.status;
              status.should.equal(403);

              var errorMessage = testUtils.getServerErrorMessage(response);

              should.exist(errorMessage);
              errorMessage.should.equal('Current user id does not match user id param');

              done();
            });
        });
      });

      describe('when user is an admin', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;
        var admin = null;
        var auth = null;

        before(function(done) {
          async.series([
            function createUser_step(cb) {
              userService.createUsingCredentials({
                email: email,
                password: password
              }, function(err, _user) {
                if (err) return cb(err);

                user = _user;
                cb();
              });
            },
            function createAdmin_step(cb) {
              adminService.create({
                userId: user._id
              }, function(err, _admin) {
                if (err) return cb(err);

                admin = _admin;
                cb();
              });
            },
            function authenticateUser_step(cb) {
              authService.authenticateCredentials({
                email: email,
                password: password
              }, function(err, _auth) {
                if (err) return cb(err);

                auth = _auth;
                cb();
              });
            }
          ], done);
        });

        after(function(done) {
          User.remove({
            email: email
          }, done);
        });

        after(function(done) {
          Admin.remove({
            user: user._id
          }, done);
        });

        after(function(done) {
          Auth.remove({
            user: user._id
          }, done);
        });

        describe('and the user does not exist', function() {
          it('should return the user', function(done) {

            agent
              .get('/users/123')
              .set('x-access-token', auth.token)
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var status = response.status;
                status.should.equal(404);

                var errorMessage = testUtils.getServerErrorMessage(response);

                should.exist(errorMessage);
                errorMessage.should.equal('User not found');

                done();
              });
          });
        });
      });

      describe('when user does exist', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;
        var auth = null;

        before(function(done) {
          async.series([
            function createUser_step(cb) {
              userService.createUsingCredentials({
                email: email,
                password: password
              }, function(err, _user) {
                if (err) return cb(err);

                user = _user;
                cb();
              });
            },
            function authenticateUser_step(cb) {
              authService.authenticateCredentials({
                email: email,
                password: password
              }, function(err, _auth) {
                if (err) return cb(err);

                auth = _auth;
                cb();
              });
            }
          ], done);
        });

        after(function(done) {
          User.remove({
            email: email
          }, done);
        });

        after(function(done) {
          Auth.remove({
            user: user._id
          }, done);
        });

        it('should return the user', function(done) {

          agent
            .get('/users/' + user._id)
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);
              should.exist(response);

              var foundUser = response.body;

              should.exist(foundUser);
              foundUser._id.should.equal(user._id);
              foundUser.email.should.equal(user.email);

              done();
            });
        });
      });
    });
  });
});
