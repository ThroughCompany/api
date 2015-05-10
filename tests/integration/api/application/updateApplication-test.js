/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/integration/before-all');

var should = require('should');
var async = require('async');
var diff = require('rfc6902');
var _ = require('underscore');
var moment = require('moment');

var app = require('src');
var appConfig = require('src/config/app-config');

var utils = require('utils/utils');
var testUtils = require('tests/lib/test-utils');

var userService = require('modules/user');
var authService = require('modules/auth');
var adminService = require('modules/admin');
var projectService = require('modules/project');
var needService = require('modules/need');
var applicationService = require('modules/application');
var organizationService = require('modules/organization');

var User = require('modules/user/data/model');
var Auth = require('modules/auth/data/model');
var Admin = require('modules/admin/data/model');
var Project = require('modules/project/data/projectModel');
var Need = require('modules/need/data/needModel');
var Application = require('modules/application/data/applicationModel');
var ProjectUser = require('modules/project/data/userModel');
var Organization = require('modules/organization/data/organizationModel');

var APPLICATION_STATUSES = require('modules/application/constants/applicationStatuses');

var agent;

/* =========================================================================
 * Before All
 * ========================================================================= */

before(function(done) {
  agent = require('tests/lib/agent').getAgent();

  done();
});

describe('api', function() {
  describe('application', function() {
    describe('PATCH - /applications/{id}', function() {
      describe('when user is not authenticated', function() {
        it('should return a 401', function(done) {

          agent
            .patch('/applications/345')
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
        describe('when trying to update an application when they aren\'t a member of the organization and is not an admin', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var user2 = null;
          var auth = null;
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
                  email: email1,
                  password: password
                }, function(err, _auth) {
                  if (err) return cb(err);

                  auth = _auth;
                  cb();
                });
              },
              function createUserProjectStep_step(cb) {
                organizationService.create({
                  createdByUserId: user2._id,
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
            Organization.remove({
              _id: organization._id
            }, done);
          });

          it('should return a 403', function(done) {
            agent
              .patch('/applications/345')
              .set('x-access-token', auth.token)
              .send({
                organizationId: organization._id
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
      });

      describe('project applications', function() {
        describe('when trying to update an application when they aren\'t a member of the project and is not an admin', function() {
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
              .patch('/applications/345')
              .set('x-access-token', auth.token)
              .send({
                projectId: project._id
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

        describe('when no updates are passed', function() {
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
              .patch('/applications/345')
              .send({
                projectId: project._id,
                patches: []
              })
              .set('x-access-token', auth.token)
              .end(function(err, response) {
                should.not.exist(err);

                var error = response.body;
                should.exist(error);

                var status = response.status;
                status.should.equal(400);

                var errorMessage = utils.getServerErrorMessage(response);

                should.exist(errorMessage);
                errorMessage.should.equal('patches must contain values');

                done();
              });
          });
        });

        describe('when trying to update non-updateable properties', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var user2 = null;
          var auth1 = null;
          var auth2 = null;
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
              function createNeed_step(cb) {
                needService.create({
                  userId: user1._id,
                  name: 'Programmer',
                  description: 'Node js programmer',
                  skills: ['HTML5']
                }, function(err, _need) {
                  if (err) return cb(err);

                  need = _need;
                  cb();
                });
              },
              function createApplication_step(cb) {
                applicationService.create({
                  createdByUserId: user2._id,
                  userId: user1._id,
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
              user: {
                $in: [user1._id, user2._id]
              }
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

          it('should ignore any non-updateable properties', function(done) {

            var applicationClone = _.clone(application.toJSON());

            applicationClone._id = '123';

            var patches = diff.diff(application.toJSON(), applicationClone);

            agent
              .patch('/applications/' + application._id)
              .send({
                userId: user1._id,
                patches: patches
              })
              .set('x-access-token', auth1.token)
              .end(function(err, response) {
                should.not.exist(err);

                var status = response.status;
                status.should.equal(200);

                var updatedProjectApplication = response.body;
                should.exist(updatedProjectApplication);

                Application.findById(application._id, function(err, foundApplication) {
                  if (err) return done(err);

                  foundApplication._id.should.equal(application._id);

                  done();
                });
              });
          });
        });

        describe('when application status is updated to APPROVED', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var user2 = null;
          var auth1 = null;
          var auth2 = null;
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
                  createdByUserId: user1._id,
                  name: 'Project 1',
                  shortDescription: 'short desc'
                }, function(err, _project) {
                  if (err) return cb(err);

                  project = _project;

                  cb();
                });
              },
              function createNeed_step(cb) {
                needService.create({
                  projectId: project._id,
                  name: 'Programmer',
                  description: 'Node js programmer',
                  skills: ['HTML5']
                }, function(err, _need) {
                  if (err) return cb(err);

                  need = _need;
                  cb();
                });
              },
              function createApplication_step(cb) {
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

          after(function(done) {
            Application.remove({
              _id: application._id
            }, done);
          });

          it('should update the application status to APPROVED and add a new project user to the project', function(done) {

            var applicationClone = _.clone(application.toJSON());

            applicationClone.status = APPLICATION_STATUSES.APPROVED;

            var patches = diff.diff(application.toJSON(), applicationClone);

            agent
              .patch('/applications/' + application._id)
              .send({
                projectId: project._id,
                patches: patches
              })
              .set('x-access-token', auth1.token)
              .end(function(err, response) {
                should.not.exist(err);

                var status = response.status;
                status.should.equal(200);

                var updatedApplication = response.body;
                should.exist(updatedApplication);

                Application.findById(application._id, function(err, foundApplication) {
                  if (err) return done(err);

                  foundApplication.status.should.equal(APPLICATION_STATUSES.APPROVED);

                  Project.findById(foundApplication.project, function(err, project) {
                    if (err) return done(err);

                    project._id.should.equal(foundApplication.project);
                    project.projectUsers.length.should.equal(2);

                    ProjectUser.find({
                      project: foundApplication.project
                    }, function(err, projectUsers) {
                      if (err) return done(err);

                      projectUsers.length.should.equal(2);

                      var newProjectUser = _.find(projectUsers, function(projectUser) {
                        return projectUser.user === foundApplication.createdByUser;
                      });

                      should.exist(newProjectUser);

                      done();
                    });
                  });
                });
              });
          });
        });
      });

      describe('user applications', function() {
        describe('when trying to update an application when they aren\'t the user the application is for', function() {
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
              .patch('/applications/345')
              .set('x-access-token', auth.token)
              .send({
                userId: user2._id
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
      });
    });
  });
});
