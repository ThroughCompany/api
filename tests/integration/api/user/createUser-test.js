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
    describe('POST - /users', function() {
      describe('when email is not unique', function() {
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
            }
          ], done);
        });

        after(function(done) {
          User.remove({
            email: email
          }, done);
        });

        it('should return the user', function(done) {

          agent
            .post('/users/')
            .send({
              email: email,
              password: 'FOOBAR'
            })
            .end(function(err, response) {
              should.not.exist(err);
              should.exist(response);

              var errorMessage = testUtils.getServerErrorMessage(response);

              should.exist(errorMessage);
              errorMessage.should.equal('A user with the email ' + email + ' already exists');

              done();
            });
        });
      });

      describe('when email is unique', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var auth = null;

        after(function(done) {
          User.remove({
            email: email
          }, done);
        });

        it('should return the user', function(done) {

          agent
            .post('/users/')
            .send({
              email: email,
              password: password
            })
            .end(function(err, response) {
              should.not.exist(err);
              should.exist(response);

              var user = response.body;

              should.exist(user);
              user.email.should.equal(email);

              user.userName.should.equal('testuser');

              //user.created.should.be.lessThan(Date.now());
              //user.modified.should.be.lessThan(new Date());

              done();
            });
        });
      });
    });
  });
});
