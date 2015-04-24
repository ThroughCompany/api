/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/integration/before-all');

var should = require('should');
var async = require('async');
var sinon = require('sinon');
var moment = require('moment');

var app = require('src');
var appConfig = require('src/config/app-config');

var testUtils = require('tests/lib/test-utils');

var userService = require('modules/user');
var authService = require('modules/auth');
var adminService = require('modules/admin');
var skillService = require('modules/skill');
var projectService = require('modules/project');

var User = require('modules/user/data/model');
var Auth = require('modules/auth/data/model');
var Admin = require('modules/admin/data/model');
var Skill = require('modules/skill/data/model');
var Project = require('modules/project/data/projectModel');
var ProjectNeed = require('modules/project/data/needModel');

var PROJECT_EVENTS = require('modules/project/constants/events');
var NEED_EMPLOYMENT_TYPES = require('modules/project/constants/needEmploymentTypes');

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
  describe('project', function() {
    describe('POST - /projects/{id}/needs', function() {
      after(function(next) {
        sandbox.restore();

        next();
      });

      describe('when user is not authenticated', function() {
        it('should return a 401', function(done) {

          agent
            .post('/projects/123/needs')
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
            .post('/projects/123/needs')
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

      describe('when trying to update a project they aren\'t a member of and is not an admin', function() {
        var email1 = 'testuser1@test.com';
        var email2 = 'testuser2@test.com';
        var password = 'password';
        var user1 = null;
        var user2 = null;
        var auth = null;
        var project = null;

        before(function(done) {
          async.series([
            function createUser1_step(cb) {
              userService.createUsingCredentials({
                email: email1,
                password: password
              }, function(err, _user) {
                if (err) return cb(err);

                user1 = _user;
                cb();
              });
            },
            function createUser2_step(cb) {
              userService.createUsingCredentials({
                email: email2,
                password: password
              }, function(err, _user) {
                if (err) return cb(err);

                user2 = _user;
                cb();
              });
            },
            function authenticateUser_step(cb) {
              authService.authenticateCredentials({
                email: email1,
                password: password
              }, function(err, _auth) {
                if (err) return cb(err);

                auth = _auth;
                cb();
              });
            },
            function createUserProjectStep_step(cb) {
              projectService.create({
                createdByUserId: user2._id,
                name: 'Project 1',
                shortDescription: 'short desc'
              }, function(err, _project) {
                if (err) return cb(err);

                project = _project;
                cb();
              });
            }
          ], done);
        });

        after(function(done) {
          User.remove({
            email: {
              $in: [email1, email2]
            }
          }, done);
        });

        after(function(done) {
          Auth.remove({
            user: user1._id
          }, done);
        });

        after(function(done) {
          Project.remove({
            _id: project._id
          }, done);
        });

        it('should return a 403', function(done) {
          agent
            .post('/projects/' + project._id + '/needs')
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);

              var error = response.body;
              should.exist(error);

              var status = response.status;
              status.should.equal(403);

              var errorMessage = testUtils.getServerErrorMessage(response);

              should.exist(errorMessage);
              errorMessage.should.equal('Access Denied');

              done();
            });
        });
      });

      describe('when not all required data is passed', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;
        var auth = null;
        var project = null;

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
            },
            function createUserProjectStep_step(cb) {
              projectService.create({
                createdByUserId: user._id,
                name: 'Project 1',
                shortDescription: 'short desc'
              }, function(err, _project) {
                if (err) return cb(err);

                project = _project;
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
          Project.remove({
            _id: project._id
          }, done);
        });

        it('should return a 400', function(done) {
          agent
            .post('/projects/' + project._id + '/needs')
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);

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
        var project = null;
        var needName = 'Node JS Programmer';
        var needDescription = 'We need an awesome Node JS programmer';
        var needSkills = ['Programmer', 'Node JS'];
        var needLocationSpecific = true;
        var needTimeCommitment = {
          totalHours: 200
        };
        var needDuration = {
          startDate: moment(),
          endDate: moment().add(6, 'month')
        };

        var createSkillSpy;

        before(function(done) {

          createSkillSpy = sandbox.spy();

          projectService.on(PROJECT_EVENTS.SKILL_USED_BY_PROJECT, createSkillSpy);

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
            },
            function createUserProjectStep_step(cb) {
              projectService.create({
                createdByUserId: user._id,
                name: 'Project 1',
                shortDescription: 'short desc'
              }, function(err, _project) {
                if (err) return cb(err);

                project = _project;
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
          Project.remove({
            _id: project._id
          }, done);
        });

        after(function(done) {
          ProjectNeed.remove({
            project: project._id
          }, done);
        });

        it('should create a new need and bump the skills user count', function(done) {
          agent
            .post('/projects/' + project._id + '/needs')
            .set('x-access-token', auth.token)
            .send({
              name: needName,
              description: needDescription,
              skills: needSkills,
              locationSpecific: needLocationSpecific,
              duration: needDuration,
              timeCommitment: needTimeCommitment
            })
            .end(function(err, response) {
              should.not.exist(err);
              should.exist(response);

              var status = response.status;
              status.should.equal(201);

              var projectNeed = response.body;
              should.exist(projectNeed);

              projectNeed.name.should.equal(needName);
              projectNeed.description.should.equal(needDescription);
              projectNeed.locationSpecific.should.equal(needLocationSpecific);
              should.exist(projectNeed.duration);
              should.exist(projectNeed.duration.startDate);
              should.exist(projectNeed.duration.endDate);
              new Date(projectNeed.duration.startDate).getTime().should.equal(needDuration.startDate.toDate().getTime());
              new Date(projectNeed.duration.endDate).getTime().should.equal(needDuration.endDate.toDate().getTime());
              should.exist(projectNeed.timeCommitment);
              projectNeed.timeCommitment.totalHours.should.equal(needTimeCommitment.totalHours);

              createSkillSpy.callCount.should.equal(needSkills.length);

              done();
            });
        });
      });
    });
  });
});
