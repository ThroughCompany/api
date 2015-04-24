/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/integration/before-all');

var should = require('should');
var async = require('async');
var _ = require('underscore');

var app = require('src');
var appConfig = require('src/config/app-config');

var testUtils = require('tests/lib/test-utils');

var userService = require('modules/user');
var adminService = require('modules/admin');
var authService = require('modules/auth');
var projectService = require('modules/project');
var organizationService = require('modules/organization');

var User = require('modules/user/data/model');
var Admin = require('modules/admin/data/model');
var Auth = require('modules/auth/data/model');
var Project = require('modules/project/data/projectModel');
var ProjectUser = require('modules/project/data/userModel');
var Permission = require('modules/permission/data/model');
var Organization = require('modules/organization/data/organizationModel');
var OrganizationProject = require('modules/organization/data/projectModel');

var PERMISSION_NAMES = require('modules/permission/constants/permissionNames');

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
    describe('POST - /projects', function() {
      describe('when user is not authenticated', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;

        it('should return a 401', function(done) {
          agent
            .post('/projects')
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

      describe('when invalid data is passed', function() {
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
            .post('/projects')
            .set('x-access-token', auth.token)
            .send({
              name: null
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
              errorMessage.should.equal('Name is required');

              done();
            });
        });
      });

      describe('when an organization id is passed, but the user is not part of the organization', function() {
        var email1 = 'testuser1@test.com';
        var email2 = 'testuser2@test.com';
        var password = 'password';
        var user1 = null;
        var auth1 = null;
        var user2 = null;
        var auth2 = null;
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
            function createOrganization_step(cb) {
              organizationService.create({
                name: 'Org 1',
                description: 'Org 1',
                createdByUserId: user2._id
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
            user: {
              $in: [user1._id, user2._id]
            }
          }, done);
        });

        after(function(done) {
          Organization.remove({
            _id: organization._id
          }, done);
        });

        it('should return a 400', function(done) {

          agent
            .post('/projects')
            .set('x-access-token', auth1.token)
            .send({
              name: 'Project 1 - With Organization',
              organizationId: organization._id
            })
            .end(function(err, response) {
              should.not.exist(err);
              should.exist(response);

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

      describe('when valid data is passed', function() {
        describe('and user does not already have projects', function() {
          var email = 'testuser@test.com';
          var password = 'password';
          var user = null;
          var auth = null;

          var projectName = 'Project FOOBAR';

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

          after(function(done) {
            Project.remove({
              name: projectName
            }, done);
          });

          it('should create a new project and create a new project user with permissions', function(done) {

            agent
              .post('/projects')
              .set('x-access-token', auth.token)
              .send({
                name: projectName,
                shortDescription: 'short description'
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var status = response.status;
                status.should.equal(201);

                var newProject = response.body;
                should.exist(newProject);

                newProject.name.should.equal(projectName);
                newProject.projectUsers.length.should.equal(1);

                var projectUserId = newProject.projectUsers[0];

                ProjectUser.findById(projectUserId, function(err, projectUser) {
                  if (err) return next(err);

                  should.exist(projectUser);

                  projectUser.user.should.equal(user._id);

                  Permission.find({
                    _id: {
                      $in: projectUser.permissions
                    }
                  }, function(err, permissions) {
                    if (err) return next(err);

                    var addUserPermissions = _.find(permissions, function(perm) {
                      return perm.name === PERMISSION_NAMES.ADD_PROJECT_USERS;
                    });

                    should.exist(addUserPermissions);

                    done();
                  });
                });
              });
          });
        });

        describe('and user does already have projects', function() {
          var email = 'testuser@test.com';
          var password = 'password';
          var user = null;
          var auth = null;

          var project = null;

          var projectName = 'Project FOOBAR';

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
              function create1rstProject_step(cb) {
                projectService.create({
                  createdByUserId: user._id,
                  name: 'Blah'
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
              $or: [{
                name: projectName
              }, {
                _id: project._id
              }]
            }, done);
          });

          it('should create a new project and create another new project user for the user', function(done) {

            agent
              .post('/projects')
              .set('x-access-token', auth.token)
              .send({
                name: projectName,
                shortDescription: 'short description'
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var status = response.status;
                status.should.equal(201);

                var newProject = response.body;
                should.exist(newProject);

                ProjectUser.find({
                  user: user._id
                }, function(err, projectUsers) {
                  if (err) return next(err);

                  should.exist(projectUsers);

                  projectUsers.length.should.equal(2);

                  done();
                });
              });
          });
        });

        describe('and a valid organizationId is passed', function() {
          var email = 'testuser@test.com';
          var password = 'password';
          var user = null;
          var auth = null;
          var organization = null;

          var projectName = 'Project FOOBAR';

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
              function createOrganization_step(cb) {
                organizationService.create({
                  createdByUserId: user._id,
                  name: 'Org 1',
                  description: 'Org 1'
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
            Project.remove({
              name: projectName
            }, done);
          });

          after(function(done) {
            Organization.remove({
              _id: organization._id
            }, done);
          });

          it('should create a new project and create organizationProject to connect to the organizationId', function(done) {

            agent
              .post('/projects')
              .set('x-access-token', auth.token)
              .send({
                name: projectName,
                shortDescription: 'short description',
                organizationId: organization._id
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var status = response.status;
                status.should.equal(201);

                var newProject = response.body;
                should.exist(newProject);

                ProjectUser.find({
                  user: user._id
                }, function(err, projectUsers) {
                  if (err) return next(err);

                  should.exist(projectUsers);

                  projectUsers.length.should.equal(1);

                  Organization.findById(organization._id, function(err, org) {
                    if (err) return done(err);

                    should.exist(org);
                    org.organizationProjects.length.should.equal(1);

                    OrganizationProject.findById(org.organizationProjects[0], function(err, organizationProject) {
                      if (err) return done(err);

                      should.exist(organizationProject);
                      organizationProject.organization.should.equal(organization._id);
                      organizationProject.project.should.equal(newProject._id);

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
});
