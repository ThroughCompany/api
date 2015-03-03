/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/integration/before-all');

var should = require('should');
var sinon = require('sinon');
var fb = require('fb');

var app = require('src');
var appConfig = require('src/config/app-config');

var userService = require('modules/user');

var testUtils = require('tests/lib/test-utils');

//models
var User = require('modules/user/data/model');
var Auth = require('modules/auth/data/model');

var agent;
var sandbox;

/* =========================================================================
 * Before All
 * ========================================================================= */

before(function(done) {
  agent = require('tests/lib/agent').getAgent();
  sandbox = sinon.sandbox.create();

  done();
});

describe('api', function() {
  describe('user', function() {
    describe('POST - /auth/facebook', function() {

      after(function(next) {
        sandbox.restore();

        next();
      });

      describe('when user does not already have an account', function() {
        var facebookId = '123';
        var facebookUserName = 'test user';
        var email = 'testuser1@foobar.com';

        before(function(next) {
          //stub out the facebook api method so it doesn't fail
          var stub = sandbox.stub(fb, 'napi', function(method, callback) {
            if (method === 'me') {
              callback(null, {
                id: facebookId,
                email: email,
                username: facebookUserName
              });
            } else {
              return callback(new Error('invalid method'));
            }
          });

          next();
        });

        after(function(done) {
          User.remove({
            email: email
          }, done);
        });

        after(function(next) {
          sandbox.restore();

          next();
        });

        it('should create an account and return a token', function(done) {

          agent
            .post('/auth/facebook')
            .send({
              facebookAccessToken: 'xxxx-xxxx'
            })
            .end(function(err, response) {
              should.not.exist(err);

              var status = response.status;
              status.should.equal(200);

              var auth = response.body;
              should.exist(auth);

              var user = auth.user;
              should.exist(user);

              User.findOne({
                email: email
              }, function(err, foundUser) {
                should.not.exist(err);
                should.exist(foundUser);

                foundUser.email.should.equal(email);
                should.exist(foundUser.facebook);
                foundUser.facebook.id.should.equal(facebookId);
                foundUser.facebook.username.should.equal(facebookUserName);

                done();
              });
            });
        });
      });

      describe('when user already has an account', function() {
        var facebookId = '123';
        var facebookUserName = 'test user';
        var email = 'testuser2@foobar.com';
        var password = 'password';
        var _user = null;

        before(function(next) {
          //stub out the facebook api method so it doesn't fail
          var stub = sandbox.stub(fb, 'napi', function(method, callback) {
            if (method === 'me') {
              callback(null, {
                id: facebookId,
                email: email,
                username: facebookUserName
              });
            } else {
              return callback(new Error('invalid method'));
            }
          });

          userService.createUsingCredentials({
            email: email,
            password: password
          }, function(err, user) {
            _user = user;

            next();
          });
        });

        after(function(done) {
          User.remove({
            email: email
          }, done);
        });

        after(function(next) {
          sandbox.restore();

          next();
        });

        it('should add facebook to their account and return a token', function(done) {

          agent
            .post('/auth/facebook')
            .send({
              facebookAccessToken: 'xxxx-xxxx'
            })
            .end(function(err, response) {
              should.not.exist(err);

              var status = response.status;
              status.should.equal(200);

              var auth = response.body;
              should.exist(auth);

              var user = auth.user;
              should.exist(user);

              User.findOne({
                email: email
              }, function(err, foundUser) {
                should.not.exist(err);
                should.exist(foundUser);

                foundUser.email.should.equal(email);
                should.exist(foundUser.facebook);
                foundUser.facebook.id.should.equal(facebookId);
                foundUser.facebook.username.should.equal(facebookUserName);

                done();
              });
            });
        });
      });
    });
  });
});
