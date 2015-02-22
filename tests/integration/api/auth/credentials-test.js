/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/integration/before-all');

var should = require('should');

var app = require('src');
var appConfig = require('src/config/app-config');

var userService = require('modules/user');

var testUtils = require('tests/lib/test-utils');

//models
var User = require('modules/user/data/model');
var Auth = require('modules/auth/data/model');

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
    describe('POST - /auth/credentials', function() {
      describe('with invalid credentials', function() {
        it('should return a 401 error', function(done) {

          agent
            .post('/auth/credentials')
            .send({
              email: 'FOOBAR@test.com',
              password: 'password'
            })
            .end(function(err, response) {
              should.not.exist(err);

              var error = response.body;
              should.exist(error);

              var errorMessage = testUtils.getServerErrorMessage(response);
              should.exist(errorMessage);
              errorMessage.should.equal('Invalid email or password');

              var status = response.status;
              status.should.equal(401);

              done();
            });
        });
      });

      describe('with valid credentials', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;

        before(function(done) {
          userService.createUsingCredentials({
            email: email,
            password: password
          }, function(err, _user) {
            user = _user;
            done();
          });
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

        it('should return an auth', function(done) {

          agent
            .post('/auth/credentials')
            .send({
              email: email,
              password: password
            })
            .end(function(err, response) {
              should.not.exist(err);

              var status = response.status;
              status.should.equal(200);

              var auth = response.body;
              should.exist(auth);
              should.exist(auth.expires);
              should.exist(auth.user);
              auth.user.email.should.equal(email);

              done();
            });
        });
      });

    });
  });
});
