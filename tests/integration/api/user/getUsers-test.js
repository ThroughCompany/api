/* =========================================================================
 * Dependencies
 * ========================================================================= */
var should = require('should');

var app = require('src');
var appConfig = require('src/config/app-config');

var userService = require('modules/user');
var User = require('modules/user/data/model');

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
    describe('GET - /users', function() {
      before(function(done) {
        userService.createUsingCredentials({
          email: 'testuser@test.com',
          password: 'password'
        }, done);
      });

      after(function(done) {
        User.remove({}, done);
      });

      it('should return a list of users', function(done) {

        agent
          .get('/users')
          .end(function(err, response) {
            should.not.exist(err);
            should.exist(response);

            var users = response.body;

            should.exist(users);
            users.length.should.equal(1);

            done();
          });
      });
    });
  });
});
