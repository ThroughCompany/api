/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/integration/before-all');

var should = require('should');
var async = require('async');
var _ = require('underscore');
var sinon = require('sinon');

var app = require('src');
var appConfig = require('src/config/app-config');

var testUtils = require('tests/lib/test-utils');

var userService = require('modules/user');
var adminService = require('modules/admin');
var authService = require('modules/auth');
var projectService = require('modules/project');
var needService = require('modules/need');
var organizationService = require('modules/organization');
var applicationService = require('modules/application');

var User = require('modules/user/data/model');
var Admin = require('modules/admin/data/model');
var Auth = require('modules/auth/data/model');
var Project = require('modules/project/data/projectModel');
var Application = require('modules/application/data/applicationModel');
var Need = require('modules/need/data/needModel');
var Permission = require('modules/permission/data/model');
var Organization = require('modules/organization/data/organizationModel');
var Application = require('modules/application/data/applicationModel');

var APPLICATION_STATUSES = require('modules/application/constants/applicationStatuses');
var APPLICATION_EVENTS = require('modules/application/constants/events');
var NEED_STATUSES = require('modules/need/constants/needStatuses');

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
  describe('application', function() {
    describe('POST - /applications', function() {
      after(function(next) {
        sandbox.restore();

        next();
      });

      describe('when user is not authenticated', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;

        it('should return a 401', function(done) {
          agent
            .post('/applications')
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

      describe('organization applications', function() {
        describe('when organization does not exist', function() {
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

          it('should return a 400', function(done) {

            agent
              .post('/applications')
              .set('x-access-token', auth.token)
              .send({
                organizationId: '1234',
                needId: '12345'
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var error = response.body;
                should.exist(error);

                var status = response.status;
                status.should.equal(404);

                var errorMessage = testUtils.getServerErrorMessage(response);

                should.exist(errorMessage);
                errorMessage.should.equal('No organization exists with the id 1234');

                done();
              });
          });
        });

        describe('when organization need does not exist', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var user2 = null;
          var auth1 = null;
          var organization = null;

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
                  email: email2,
                  password: password
                }, function(err, _auth) {
                  if (err) return cb(err);

                  auth1 = _auth;
                  cb();
                });
              },
              function createOrganization_step(cb) {
                organizationService.create({
                  name: 'Org 1',
                  createdByUserId: user1._id
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
              email: {
                $in: [email1, email2]
              }
            }, done);
          });

          after(function(done) {
            Auth.remove({
              user: user2._id
            }, done);
          });

          after(function(done) {
            Organization.remove({
              _id: organization._id
            }, done);
          });

          it('should return a 400', function(done) {

            agent
              .post('/applications')
              .set('x-access-token', auth1.token)
              .send({
                organizationId: organization._id,
                needId: '12345'
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var error = response.body;
                should.exist(error);

                var status = response.status;
                status.should.equal(404);

                var errorMessage = testUtils.getServerErrorMessage(response);

                should.exist(errorMessage);
                errorMessage.should.equal('Need not found');

                done();
              });
          });
        });

        describe('when need is not OPEN', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var user2 = null;
          var auth1 = null;
          var organization = null;
          var need = null;

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

                  auth1 = _auth;
                  cb();
                });
              },
              function createOrganization_step(cb) {
                organizationService.create({
                  name: 'Org 1',
                  createdByUserId: user1._id
                }, function(err, _organization) {
                  if (err) return cb(err);

                  organization = _organization;
                  cb();
                });
              },
              function createNeed_step(cb) {
                needService.create({
                  organizationId: organization._id,
                  name: 'Org 1',
                  description: 'FOobar',
                  skills: ['Programming']
                }, function(err, _need) {
                  if (err) return cb(err);

                  need = _need;

                  need.status = NEED_STATUSES.CLOSED;

                  need.save(cb);
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
              user: user2._id
            }, done);
          });

          after(function(done) {
            Organization.remove({
              _id: organization._id
            }, done);
          });

          after(function(done) {
            Need.remove({
              _id: need._id
            }, done);
          });

          it('should return a 400', function(done) {

            agent
              .post('/applications')
              .set('x-access-token', auth1.token)
              .send({
                organizationId: organization._id,
                needId: need._id
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var error = response.body;
                should.exist(error);

                var status = response.status;
                status.should.equal(400);

                var errorMessage = testUtils.getServerErrorMessage(response);

                should.exist(errorMessage);
                errorMessage.should.equal('Can only apply to needs that are open');

                done();
              });
          });
        });
      });

      describe('project applications', function() {
        describe('when project does not exist', function() {
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

          it('should return a 400', function(done) {

            agent
              .post('/applications')
              .set('x-access-token', auth.token)
              .send({
                projectId: '1234',
                needId: '12345'
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var error = response.body;
                should.exist(error);

                var status = response.status;
                status.should.equal(404);

                var errorMessage = testUtils.getServerErrorMessage(response);

                should.exist(errorMessage);
                errorMessage.should.equal('No project exists with the id 1234');

                done();
              });
          });
        });

        describe('when user is already a project member', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var user2 = null;
          var auth1 = null;
          var project = null;
          var need = null;

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

                  auth1 = _auth;
                  cb();
                });
              },
              function createProject_step(cb) {
                projectService.create({
                  name: 'Project 1',
                  createdByUserId: user1._id
                }, function(err, _project) {
                  if (err) return cb(err);

                  project = _project;
                  cb();
                });
              },
              function createNeed_step(cb) {
                needService.create({
                  projectId: project._id,
                  name: 'Project 1',
                  description: 'FOobar',
                  skills: ['Programming']
                }, function(err, _need) {
                  if (err) return cb(err);

                  need = _need;
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
              user: user2._id
            }, done);
          });

          after(function(done) {
            Project.remove({
              _id: project._id
            }, done);
          });

          after(function(done) {
            Need.remove({
              _id: need._id
            }, done);
          });

          it('should return a 400', function(done) {

            agent
              .post('/applications')
              .set('x-access-token', auth1.token)
              .send({
                projectId: project._id,
                needId: need._id
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var error = response.body;
                should.exist(error);

                var status = response.status;
                status.should.equal(400);

                var errorMessage = testUtils.getServerErrorMessage(response);

                should.exist(errorMessage);
                errorMessage.should.equal('You are already a member of this project');

                done();
              });
          });
        });

        describe('when user has already applied to the project', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var user2 = null;
          var auth1 = null;
          var project = null;
          var need = null;
          var application = null;

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
                  email: email2,
                  password: password
                }, function(err, _auth) {
                  if (err) return cb(err);

                  auth1 = _auth;
                  cb();
                });
              },
              function createProject_step(cb) {
                projectService.create({
                  name: 'Project 1',
                  createdByUserId: user1._id
                }, function(err, _project) {
                  if (err) return cb(err);

                  project = _project;
                  cb();
                });
              },
              function createNeed_step(cb) {
                needService.create({
                  projectId: project._id,
                  name: 'Project 1',
                  description: 'FOobar',
                  skills: ['Programming']
                }, function(err, _need) {
                  if (err) return cb(err);

                  need = _need;
                  cb();
                });
              },
              function createProjectApplication_step(cb) {
                applicationService.create({
                  createdByUserId: user2._id,
                  projectId: project._id,
                  needId: need._id
                }, function(err, _application) {
                  if (err) return cb(err);

                  application = _application;
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
              user: user2._id
            }, done);
          });

          after(function(done) {
            Project.remove({
              _id: project._id
            }, done);
          });

          after(function(done) {
            Need.remove({
              _id: need._id
            }, done);
          });

          after(function(done) {
            Application.remove({
              _id: application._id
            }, done);
          });

          it('should return a 400', function(done) {

            agent
              .post('/applications')
              .set('x-access-token', auth1.token)
              .send({
                projectId: project._id,
                needId: need._id
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var error = response.body;
                should.exist(error);

                var status = response.status;
                status.should.equal(400);

                var errorMessage = testUtils.getServerErrorMessage(response);

                should.exist(errorMessage);
                errorMessage.should.equal('You have already applied and cannot apply again');

                done();
              });
          });
        });

        describe('when all data is valid', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var user2 = null;
          var auth1 = null;
          var auth2 = null;
          var project = null;
          var need = null;

          var createApplicationSpy;

          before(function(done) {

            createApplicationSpy = sandbox.spy();

            applicationService.on(APPLICATION_EVENTS.APPLICATION_CREATED, createApplicationSpy);

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
              function authenticateUser1_step(cb) {
                authService.authenticateCredentials({
                  email: email1,
                  password: password
                }, function(err, _auth) {
                  if (err) return cb(err);

                  auth1 = _auth;
                  cb();
                });
              },
              function authenticateUser2_step(cb) {
                authService.authenticateCredentials({
                  email: email2,
                  password: password
                }, function(err, _auth) {
                  if (err) return cb(err);

                  auth2 = _auth;
                  cb();
                });
              },
              function createProject_step(cb) {
                projectService.create({
                  name: 'Project 1',
                  createdByUserId: user1._id
                }, function(err, _project) {
                  if (err) return cb(err);

                  project = _project;
                  cb();
                });
              },
              function createNeed_step(cb) {
                needService.create({
                  projectId: project._id,
                  name: 'Project 1',
                  description: 'FOobar',
                  skills: ['Programming']
                }, function(err, _need) {
                  if (err) return cb(err);

                  need = _need;
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
              user: {
                $in: [user1._id, user2._id]
              }
            }, done);
          });

          after(function(done) {
            Project.remove({
              _id: project._id
            }, done);
          });

          after(function(done) {
            Need.remove({
              _id: need._id
            }, done);
          });

          it('should create a new application', function(done) {

            agent
              .post('/applications')
              .set('x-access-token', auth2.token)
              .send({
                projectId: project._id,
                createdByUserId: user2._id,
                needId: need._id
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var status = response.status;
                status.should.equal(201);

                var application = response.body;
                should.exist(application);
                application.status.should.equal(APPLICATION_STATUSES.PENDING);
                application.createdByUser.should.equal(user2._id);
                application.project.should.equal(project._id);
                application.need.should.equal(need._id);

                createApplicationSpy.callCount.should.equal(1);

                done();
              });
          });
        });
      });

      describe('user applications', function() {
        describe('when user does not exist', function() {
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

          it('should return a 400', function(done) {

            agent
              .post('/applications')
              .set('x-access-token', auth.token)
              .send({
                userId: '1234',
                needId: '12345'
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var error = response.body;
                should.exist(error);

                var status = response.status;
                status.should.equal(404);

                var errorMessage = testUtils.getServerErrorMessage(response);

                should.exist(errorMessage);
                errorMessage.should.equal('No user exists with the id 1234');

                done();
              });
          });
        });
      });
    });
  });
});
