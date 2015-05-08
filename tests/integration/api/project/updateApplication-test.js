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

var User = require('modules/user/data/model');
var Auth = require('modules/auth/data/model');
var Admin = require('modules/admin/data/model');
var Project = require('modules/project/data/projectModel');
var Need = require('modules/need/data/needModel');
var ProjectApplication = require('modules/project/data/applicationModel');
var ProjectUser = require('modules/project/data/userModel');

var APPLICATION_STATUSES = require('modules/project/constants/applicationStatuses');

var agent;

/* =========================================================================
 * Before All
 * ========================================================================= */

before(function(done) {
  agent = require('tests/lib/agent').getAgent();

  done();
});

describe('api', function() {
  describe('project', function() {
    describe('PATCH - /projects/{id}/applications/{applicationId}', function() {
      describe('when user is not authenticated', function() {
        it('should return a 401', function(done) {

          agent
            .patch('/projects/123/applications/345')
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

      describe('when trying to update a project application when they aren\'t a member of the project and is not an admin', function() {
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
            .patch('/projects/' + project._id + '/applications/345')
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
            .patch('/projects/' + project._id + '/applications/345')
            .send({
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
        var project = null;
        var projectNeed = null;
        var projectApplication = null;

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
            function createProjectNeed_step(cb) {
              projectService.createNeed({
                projectId: project._id,
                name: 'Programmer',
                description: 'Node js programmer',
                skills: ['HTML5']
              }, function(err, _projectNeed) {
                if (err) return cb(err);

                projectNeed = _projectNeed;
                cb();
              });
            },
            function createProjectApplication_step(cb) {
              projectService.createApplication({
                projectId: project._id,
                userId: user2._id,
                needId: projectNeed._id
              }, function(err, _projectApplication) {
                if (err) return cb(err);

                projectApplication = _projectApplication;
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
          ProjectNeed.remove({
            _id: projectNeed._id
          }, done);
        });

        after(function(done) {
          ProjectApplication.remove({
            _id: projectApplication._id
          }, done);
        });

        it('should ignore any non-updateable properties', function(done) {

          var projectApplicationClone = _.clone(projectApplication.toJSON());

          projectApplicationClone._id = '123';

          var patches = diff.diff(projectApplication.toJSON(), projectApplicationClone);

          agent
            .patch('/projects/' + project._id + '/applications/' + projectApplication._id)
            .send({
              patches: patches
            })
            .set('x-access-token', auth1.token)
            .end(function(err, response) {
              should.not.exist(err);

              var status = response.status;
              status.should.equal(200);

              var updatedProjectApplication = response.body;
              should.exist(updatedProjectApplication);

              ProjectApplication.findById(projectApplication._id, function(err, foundProjectApplication) {
                if (err) return done(err);

                foundProjectApplication._id.should.equal(projectApplication._id);

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
        var projectNeed = null;
        var projectApplication = null;

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
            function createProjectNeed_step(cb) {
              projectService.createNeed({
                projectId: project._id,
                name: 'Programmer',
                description: 'Node js programmer',
                skills: ['HTML5']
              }, function(err, _projectNeed) {
                if (err) return cb(err);

                projectNeed = _projectNeed;
                cb();
              });
            },
            function createProjectApplication_step(cb) {
              projectService.createApplication({
                projectId: project._id,
                userId: user2._id,
                needId: projectNeed._id
              }, function(err, _projectApplication) {
                if (err) return cb(err);

                projectApplication = _projectApplication;
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
          ProjectNeed.remove({
            _id: projectNeed._id
          }, done);
        });

        after(function(done) {
          ProjectApplication.remove({
            _id: projectApplication._id
          }, done);
        });

        it('should update the application status to APPROVED and add a new project user to the project', function(done) {

          var projectApplicationClone = _.clone(projectApplication.toJSON());

          projectApplicationClone.status = APPLICATION_STATUSES.APPROVED;

          var patches = diff.diff(projectApplication.toJSON(), projectApplicationClone);

          agent
            .patch('/projects/' + project._id + '/applications/' + projectApplication._id)
            .send({
              patches: patches
            })
            .set('x-access-token', auth1.token)
            .end(function(err, response) {
              should.not.exist(err);

              var status = response.status;
              status.should.equal(200);

              var updatedProjectApplication = response.body;
              should.exist(updatedProjectApplication);

              ProjectApplication.findById(projectApplication._id, function(err, foundProjectApplication) {
                if (err) return done(err);

                foundProjectApplication.status.should.equal(APPLICATION_STATUSES.APPROVED);

                Project.findById(foundProjectApplication.project, function(err, project) {
                  if (err) return done(err);

                  project._id.should.equal(foundProjectApplication.project);
                  project.projectUsers.length.should.equal(2);

                  ProjectUser.find({
                    project: foundProjectApplication.project
                  }, function(err, projectUsers) {
                    if (err) return done(err);

                    projectUsers.length.should.equal(2);

                    var newProjectUser = _.find(projectUsers, function(projectUser) {
                      return projectUser.user === foundProjectApplication.user;
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
  });
});
