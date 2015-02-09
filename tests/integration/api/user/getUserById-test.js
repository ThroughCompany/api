/* =========================================================================
 * Dependencies
 * ========================================================================= */
var should = require('should');

var app = require('src');
var appConfig = require('src/config/app-config');

var testUtils = require('tests/lib/test-utils');

var userService = require('modules/user');
var User = require('modules/user/data/model');
var Auth = require('modules/auth/data/model');

var agent;

/* =========================================================================
 * Before All
 * ========================================================================= */
require('tests/integration/before-all');

before(function(done) {
  agent = require('tests/lib/agent').getAgent();

  done();
});

describe('api', function() {
  describe('user', function() {
    describe('GET - /users/{id}', function() {
      describe('when user does not exist', function() {
        it('should return a 404', function(done) {
          agent
            .get('/users/123')
            .end(function(err, response) {
              should.not.exist(err);

              var error = response.body;
              should.exist(error);

              var status = response.status;
              status.should.equal(404);

              var errorMessage = testUtils.getServerErrorMessage(response);
              should.exist(errorMessage);
              errorMessage.should.equal('User not found');

              done();
            });
        });
      });

      describe('when user does exist', function() {
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

        it('should return the user', function(done) {

          agent
            .get('/users/' + user._id)
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
