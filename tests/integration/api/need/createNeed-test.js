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
var organizationService = require('modules/organization');
var projectService = require('modules/project');
var needService = require('modules/need');

var User = require('modules/user/data/model');
var Auth = require('modules/auth/data/model');
var Admin = require('modules/admin/data/model');
var Skill = require('modules/skill/data/model');
var Organization = require('modules/organization/data/organizationModel');
var Project = require('modules/project/data/projectModel');
var Need = require('modules/need/data/needModel');

var NEED_EVENTS = require('modules/need/constants/events');
var NEED_STATUSES = require('modules/need/constants/needStatuses');
var NEED_TYPES = require('modules/need/constants/needTypes');

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
  describe('need', function() {
    describe('POST - /needs', function() {
      after(function(next) {
        sandbox.restore();

        next();
      });

      describe('when user is not authenticated', function() {
        it('should return a 401', function(done) {

          agent
            .post('/needs')
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

      describe('organization need', function() {
        describe('when trying to create a need for an organization they aren\'t a member of and is not an admin', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var user2 = null;
          var auth = null;

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

          it('should return a 403', function(done) {
            agent
              .post('/needs')
              .set('x-access-token', auth.token)
              .send({
                organizationId: '123'
              })
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
          var organization = null;

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
                organizationService.create({
                  createdByUserId: user._id,
                  name: 'Org 1'
                }, function(err, _organization) {
                  if (err) return cb(err);

                  organization = _organization;
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
            Organization.remove({
              _id: organization._id
            }, done);
          });

          it('should return a 400', function(done) {
            agent
              .post('/needs')
              .set('x-access-token', auth.token)
              .send({
                organizationId: organization._id
              })
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
          var organization = null;
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

            needService.on(NEED_EVENTS.SKILL_USED, createSkillSpy);

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
              function createOrganizationStep_step(cb) {
                organizationService.create({
                  createdByUserId: user._id,
                  name: 'Project 1'
                }, function(err, _organization) {
                  if (err) return cb(err);

                  organization = _organization;
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
            Organization.remove({
              _id: organization._id
            }, done);
          });

          after(function(done) {
            Need.remove({
              project: organization._id
            }, done);
          });

          it('should create a new need and bump the skills organization count', function(done) {
            agent
              .post('/needs')
              .set('x-access-token', auth.token)
              .send({
                organizationId: organization._id,
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

                var need = response.body;
                should.exist(need);

                need.name.should.equal(need.name);
                need.description.should.equal(needDescription);
                need.locationSpecific.should.equal(needLocationSpecific);
                need.status.should.equal(NEED_STATUSES.OPEN);
                need.organization.should.equal(organization._id);
                need.type.should.equal(NEED_TYPES.ORGANIZATION);

                should.exist(need.duration);
                should.exist(need.duration.startDate);
                should.exist(need.duration.endDate);
                need.skills.length.should.equal(needSkills.length);
                new Date(need.duration.startDate).getTime().should.equal(needDuration.startDate.toDate().getTime());
                new Date(need.duration.endDate).getTime().should.equal(needDuration.endDate.toDate().getTime());
                should.exist(need.timeCommitment);
                need.timeCommitment.totalHours.should.equal(needTimeCommitment.totalHours);

                createSkillSpy.callCount.should.equal(needSkills.length);

                done();
              });
          });
        });
      });

      describe('project need', function() {
        describe('when trying to create a need for a project they aren\'t a member of and is not an admin', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var user2 = null;
          var auth = null;

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

          it('should return a 403', function(done) {
            agent
              .post('/needs')
              .set('x-access-token', auth.token)
              .send({
                projectId: '123'
              })
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

            needService.on(NEED_EVENTS.SKILL_USED, createSkillSpy);

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
              function createOrganizationStep_step(cb) {
                projectService.create({
                  createdByUserId: user._id,
                  name: 'Project 1',
                  shortDescription: 'Foobar'
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
            Need.remove({
              project: project._id
            }, done);
          });

          it('should create a new need and bump the skills project count', function(done) {
            agent
              .post('/needs')
              .set('x-access-token', auth.token)
              .send({
                projectId: project._id,
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

                var need = response.body;
                should.exist(need);

                need.name.should.equal(need.name);
                need.description.should.equal(needDescription);
                need.locationSpecific.should.equal(needLocationSpecific);
                need.status.should.equal(NEED_STATUSES.OPEN);
                need.project.should.equal(project._id);
                need.type.should.equal(NEED_TYPES.PROJECT);

                should.exist(need.duration);
                should.exist(need.duration.startDate);
                should.exist(need.duration.endDate);
                need.skills.length.should.equal(needSkills.length);
                new Date(need.duration.startDate).getTime().should.equal(needDuration.startDate.toDate().getTime());
                new Date(need.duration.endDate).getTime().should.equal(needDuration.endDate.toDate().getTime());
                should.exist(need.timeCommitment);
                need.timeCommitment.totalHours.should.equal(needTimeCommitment.totalHours);

                createSkillSpy.callCount.should.equal(needSkills.length);

                done();
              });
          });
        });
      });

      describe('user need', function() {
        describe('when trying to create a need for a user that isn\' them', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var user2 = null;
          var auth = null;

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

          it('should return a 403', function(done) {
            agent
              .post('/needs')
              .set('x-access-token', auth.token)
              .send({
                userId: '123'
              })
              .end(function(err, response) {
                should.not.exist(err);

                var error = response.body;
                should.exist(error);

                var status = response.status;
                status.should.equal(403);

                var errorMessage = testUtils.getServerErrorMessage(response);

                should.exist(errorMessage);
                errorMessage.should.equal('Current user id does not match user id body param');

                done();
              });
          });
        });

        describe('when all required data is passed', function() {
          var email = 'testuser@test.com';
          var password = 'password';
          var user = null;
          var auth = null;
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

            needService.on(NEED_EVENTS.SKILL_USED, createSkillSpy);

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
            Need.remove({
              user: user._id
            }, done);
          });

          it('should create a new need and bump the skills project count', function(done) {
            agent
              .post('/needs')
              .set('x-access-token', auth.token)
              .send({
                userId: user._id,
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

                var need = response.body;
                should.exist(need);

                need.name.should.equal(need.name);
                need.description.should.equal(needDescription);
                need.locationSpecific.should.equal(needLocationSpecific);
                need.status.should.equal(NEED_STATUSES.OPEN);
                need.user.should.equal(user._id);
                need.type.should.equal(NEED_TYPES.USER);

                should.exist(need.duration);
                should.exist(need.duration.startDate);
                should.exist(need.duration.endDate);
                need.skills.length.should.equal(needSkills.length);
                new Date(need.duration.startDate).getTime().should.equal(needDuration.startDate.toDate().getTime());
                new Date(need.duration.endDate).getTime().should.equal(needDuration.endDate.toDate().getTime());
                should.exist(need.timeCommitment);
                need.timeCommitment.totalHours.should.equal(needTimeCommitment.totalHours);

                createSkillSpy.callCount.should.equal(needSkills.length);

                done();
              });
          });
        });
      });
    });
  });
});
