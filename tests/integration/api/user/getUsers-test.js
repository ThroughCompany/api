/* =========================================================================
 * Dependencies
 * ========================================================================= */
var should = require('should');

var app = require('src');
var appConfig = require('src/config/app-config');

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
    describe('GET - /users', function() {
      describe('when user is not authenticated', function() {
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

        it('should return a 401', function(done) {

          agent
            .get('/users')
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

      // describe('when user is authenticated', function() {
      //   var email = 'testuser@test.com';
      //   var password = 'password';
      //   var user = null;

      //   before(function(done) {
      //     userService.createUsingCredentials({
      //       email: email,
      //       password: password
      //     }, function(err, _user) {
      //       user = _user;
      //       done();
      //     });
      //   });

      //   after(function(done) {
      //     User.remove({
      //       email: email
      //     }, done);
      //   });

      //   after(function(done) {
      //     Auth.remove({
      //       user: user._id
      //     }, done);
      //   });

      //   it('should return a list of users', function(done) {

      //     agent
      //       .get('/users')
      //       .end(function(err, response) {
      //         should.not.exist(err);
      //         should.exist(response);

      //         var users = response.body;

      //         users.length.should.equal(1);

      //         done();
      //       });
      //   });
      // });
    });
  });
});
