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

var User = require('modules/user/data/model');
var Admin = require('modules/admin/data/model');
var Auth = require('modules/auth/data/model');
var Project = require('modules/project/data/projectModel');
var ProjectApplication = require('modules/project/data/applicationModel');
var Need = require('modules/need/data/needModel');
var Permission = require('modules/permission/data/model');

var PROJECT_APPLICATION_STATUSES = require('modules/project/constants/applicationStatuses');
var PROJECT_EVENTS = require('modules/project/constants/events');
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
  describe('project', function() {
    describe.only('POST - /projects/{id}/applications', function() {
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
            .post('/projects/123/applications')
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
            .post('/projects/123/applications')
            .set('x-access-token', auth.token)
            .send({
              userId: user._id,
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
              errorMessage.should.equal('Project not found');

              done();
            });
        });
      });

      describe('when project need does not exist', function() {
        var email1 = 'testuser1@test.com';
        var email2 = 'testuser2@test.com';
        var password = 'password';
        var user1 = null;
        var user2 = null;
        var auth1 = null;
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

        it('should return a 400', function(done) {

          agent
            .post('/projects/' + project._id + '/applications')
            .set('x-access-token', auth1.token)
            .send({
              userId: user2._id,
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
              errorMessage.should.equal('Project Need not found');

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
            .post('/projects/' + project._id + '/applications')
            .set('x-access-token', auth1.token)
            .send({
              userId: user1._id,
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
            .post('/projects/' + project._id + '/applications')
            .set('x-access-token', auth1.token)
            .send({
              userId: user1._id,
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
              projectService.createApplication({
                projectId: project._id,
                needId: need._id,
                userId: user2._id
              }, function(err, _projectApplication) {
                console.log(err);
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
          ProjectApplication.remove({
            _id: projectApplication._id
          }, done);
        });

        it('should return a 400', function(done) {

          agent
            .post('/projects/' + project._id + '/applications')
            .set('x-access-token', auth1.token)
            .send({
              userId: user2._id,
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
              errorMessage.should.equal('You have already applied to this project and cannot apply again');

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

          projectService.on(PROJECT_EVENTS.PROJECT_APPLICATION_CREATED, createApplicationSpy);

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

        it('should create a new project application', function(done) {

          agent
            .post('/projects/' + project._id + '/applications')
            .set('x-access-token', auth2.token)
            .send({
              userId: user2._id,
              needId: need._id
            })
            .end(function(err, response) {
              should.not.exist(err);
              should.exist(response);

              var status = response.status;
              status.should.equal(201);

              var projectApplication = response.body;
              should.exist(projectApplication);
              projectApplication.status.should.equal(PROJECT_APPLICATION_STATUSES.PENDING);
              projectApplication.user.should.equal(user2._id);
              projectApplication.project.should.equal(project._id);
              projectApplication.need.should.equal(need._id);

              createApplicationSpy.callCount.should.equal(1);

              done();
            });
        });
      });
    });
  });
});
