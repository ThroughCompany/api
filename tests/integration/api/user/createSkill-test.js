/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/integration/before-all');

var should = require('should');
var async = require('async');
var sinon = require('sinon');

var app = require('src');
var appConfig = require('src/config/app-config');

var testUtils = require('tests/lib/test-utils');

var userService = require('modules/user');
var authService = require('modules/auth');
var adminService = require('modules/admin');
var skillService = require('modules/skill');

var User = require('modules/user/data/model');
var Auth = require('modules/auth/data/model');
var Admin = require('modules/admin/data/model');
var Skill = require('modules/skill/data/model');

var USER_EVENTS = require('modules/user/constants/events');

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
    describe('POST - /users/{id}/skills', function() {
      after(function(next) {
        sandbox.restore();

        next();
      });

      describe('when user is not authenticated', function() {
        it('should return a 401', function(done) {

          agent
            .post('/users/123/skills')
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

      describe('when user id is not the user\'s id', function() {
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
            .post('/users/123/skills')
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);
              should.exist(response);

              var error = response.body;
              should.exist(error);

              var status = response.status;
              status.should.equal(403);

              done();
            });
        });
      });

      describe('when not all required data is passed', function() {
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

        it('should return a 500', function(done) {

          agent
            .post('/users/' + user._id + '/skills')
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);
              should.exist(response);

              var error = response.body;
              should.exist(error);

              var status = response.status;
              status.should.equal(400);

              var errorMessage = testUtils.getServerErrorMessage(response);

              errorMessage.should.equal('Name is required');

              done();
            });
        });
      });

      describe('when all required data is passed', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;
        var auth = null;
        var skillName = 'Programmer';
        var skillDescription = 'I am a Programmer';

        var createSkillSpy;

        before(function(done) {

          createSkillSpy = sandbox.spy();

          userService.on(USER_EVENTS.SKILL_USED_BY_USER, createSkillSpy);

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

        after(function(done) {
          Skill.remove({
            name: skillName
          }, done);
        });

        it('should return create a new skill and bump the skills user count', function(done) {

          agent
            .post('/users/' + user._id + '/skills')
            .set('x-access-token', auth.token)
            .send({
              name: skillName,
              description: skillDescription
            })
            .end(function(err, response) {
              should.not.exist(err);
              should.exist(response);

              var status = response.status;
              status.should.equal(201);

              var skill = response.body;
              should.exist(skill);

              skill.name.should.equal(skillName);
              skill.description.should.equal(skillDescription);

              createSkillSpy.callCount.should.equal(1);

              done();
            });
        });
      });
    });
  });
});
