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
var invitationService = require('modules/invitation');

var User = require('modules/user/data/model');
var Admin = require('modules/admin/data/model');
var Auth = require('modules/auth/data/model');
var Project = require('modules/project/data/projectModel');
var Application = require('modules/application/data/applicationModel');
var Need = require('modules/need/data/needModel');
var Permission = require('modules/permission/data/model');
var Organization = require('modules/organization/data/organizationModel');
var Invitation = require('modules/invitation/data/invitationModel');
var OrganizationUser = require('modules/organization/data/userModel');
var ProjectUser = require('modules/project/data/userModel');
var Invitation = require('modules/invitation/data/invitationModel');

var INVITATION_STATUSES = require('modules/invitation/constants/invitationStatuses');
var INVITATION_EVENTS = require('modules/invitation/constants/events');
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
  describe('invitation', function() {
    describe('POST - /invitations', function() {
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
            .post('/invitations')
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

      describe('organization invitations', function() {
        describe('when inviting user is not a member of the organization', function() {
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
              .post('/invitations')
              .set('x-access-token', auth.token)
              .send({
                organizationId: '1234',
                userId: '123'
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

        describe('when invited user does not exist', function() {
          var email = 'testuser@test.com';
          var password = 'password';
          var invitingUser = null;
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

                  invitingUser = _user;
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
                  name: 'Org 1',
                  description: 'Foo',
                  createdByUserId: invitingUser._id
                }, function(err, _organization) {
                  if (err) return cb(err);

                  organization = _organization;
                  cb();
                })
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
              user: invitingUser._id
            }, done);
          });

          after(function(done) {
            Organization.remove({
              _id: organization._id
            }, done);
          });

          it('should return a 400', function(done) {

            agent
              .post('/invitations')
              .set('x-access-token', auth.token)
              .send({
                organizationId: organization._id,
                userId: '123'
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
                errorMessage.should.equal('User not found');

                done();
              });
          });
        });

        describe('when inviting user does not have permission to invite new users', function() {
          var email = 'testuser@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var invitingUser = null;
          var invitedUser = null;
          var auth = null;
          var organization = null;

          before(function(done) {
            async.series([
              function createInvitingUser_step(cb) {
                userService.createUsingCredentials({
                  email: email,
                  password: password
                }, function(err, _user) {
                  if (err) return cb(err);

                  invitingUser = _user;
                  cb();
                });
              },
              function createInvitedUser_step(cb) {
                userService.createUsingCredentials({
                  email: email2,
                  password: password
                }, function(err, _user) {
                  if (err) return cb(err);

                  invitedUser = _user;
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
                  name: 'Org 1',
                  description: 'Foo',
                  createdByUserId: invitingUser._id
                }, function(err, _organization) {
                  if (err) return cb(err);

                  organization = _organization;

                  var organizationUserId = organization.organizationUsers[0];

                  OrganizationUser.findById(organizationUserId, function(err, orgUser) {
                    if (err) return cb(err);

                    orgUser.permissions = [];
                    orgUser.save(cb);
                  });
                })
              }
            ], done);
          });

          after(function(done) {
            User.remove({
              email: {
                $in: [email, email2]
              }
            }, done);
          });

          after(function(done) {
            Auth.remove({
              user: invitingUser._id
            }, done);
          });

          after(function(done) {
            Organization.remove({
              _id: organization._id
            }, done);
          });

          it('should return a 403', function(done) {

            agent
              .post('/invitations')
              .set('x-access-token', auth.token)
              .send({
                organizationId: organization._id,
                userId: invitedUser._id
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

        describe('when invited user has already been invited to the organization', function() {
          var email = 'testuser@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var invitingUser = null;
          var invitedUser = null;
          var auth = null;
          var organization = null;
          var invitation = null;

          before(function(done) {
            async.series([
              function createInvitingUser_step(cb) {
                userService.createUsingCredentials({
                  email: email,
                  password: password
                }, function(err, _user) {
                  if (err) return cb(err);

                  invitingUser = _user;
                  cb();
                });
              },
              function createInvitedUser_step(cb) {
                userService.createUsingCredentials({
                  email: email2,
                  password: password
                }, function(err, _user) {
                  if (err) return cb(err);

                  invitedUser = _user;
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
                  name: 'Org 1',
                  description: 'Foo',
                  createdByUserId: invitingUser._id
                }, function(err, _organization) {
                  if (err) return cb(err);

                  organization = _organization;

                  cb();
                })
              },
              function createInvitation_step(cb) {
                invitationService.create({
                  organizationId: organization._id,
                  createdByUserId: invitingUser._id,
                  userId: invitedUser._id
                }, function(err, _invitation) {
                  if (err) return cb(err);

                  invitation = _invitation;

                  cb();
                })
              }
            ], done);
          });

          after(function(done) {
            User.remove({
              email: {
                $in: [email, email2]
              }
            }, done);
          });

          after(function(done) {
            Auth.remove({
              user: invitingUser._id
            }, done);
          });

          after(function(done) {
            Organization.remove({
              _id: organization._id
            }, done);
          });

          after(function(done) {
            Invitation.remove({
              _id: invitation._id
            }, done);
          });

          it('should return a 400', function(done) {

            agent
              .post('/invitations')
              .set('x-access-token', auth.token)
              .send({
                organizationId: organization._id,
                userId: invitedUser._id
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
                errorMessage.should.equal('User has already been invited and cannot be invited again');

                done();
              });
          });
        });

        describe('when all data is valid', function() {
          var email = 'testuser@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var invitingUser = null;
          var invitedUser = null;
          var auth = null;
          var organization = null;

          var createInvitationSpy;

          before(function(done) {

            createInvitationSpy = sandbox.spy();

            invitationService.on(INVITATION_EVENTS.INVITATION_CREATED, createInvitationSpy);

            async.series([
              function createInvitingUser_step(cb) {
                userService.createUsingCredentials({
                  email: email,
                  password: password
                }, function(err, _user) {
                  if (err) return cb(err);

                  invitingUser = _user;
                  cb();
                });
              },
              function createInvitedUser_step(cb) {
                userService.createUsingCredentials({
                  email: email2,
                  password: password
                }, function(err, _user) {
                  if (err) return cb(err);

                  invitedUser = _user;
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
                  name: 'Org 1',
                  description: 'Foo',
                  createdByUserId: invitingUser._id
                }, function(err, _organization) {
                  if (err) return cb(err);

                  organization = _organization;

                  cb();
                })
              }
            ], done);
          });

          after(function(done) {
            User.remove({
              email: {
                $in: [email, email2]
              }
            }, done);
          });

          after(function(done) {
            Auth.remove({
              user: invitingUser._id
            }, done);
          });

          after(function(done) {
            Organization.remove({
              _id: organization._id
            }, done);
          });

          it('should return a 400', function(done) {

            agent
              .post('/invitations')
              .set('x-access-token', auth.token)
              .send({
                organizationId: organization._id,
                userId: invitedUser._id
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var status = response.status;
                status.should.equal(201);

                var invitation = response.body;
                should.exist(invitation);

                invitation.organization.should.equal(organization._id);
                invitation.user.should.equal(invitedUser._id);
                invitation.status.should.equal(INVITATION_STATUSES.PENDING);

                createInvitationSpy.callCount.should.equal(1);

                done();
              });
          });
        });
      });

      describe('project invitations', function() {
        describe('when inviting user is not a member of the project', function() {
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
              .post('/invitations')
              .set('x-access-token', auth.token)
              .send({
                projectId: '1234',
                userId: '123'
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

        describe('when invited user does not exist', function() {
          var email = 'testuser@test.com';
          var password = 'password';
          var invitingUser = null;
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

                  invitingUser = _user;
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
              function creatProject_step(cb) {
                projectService.create({
                  name: 'Project 1',
                  shortDescription: 'Foo',
                  createdByUserId: invitingUser._id
                }, function(err, _project) {
                  if (err) return cb(err);

                  project = _project;
                  cb();
                })
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
              user: invitingUser._id
            }, done);
          });

          after(function(done) {
            Project.remove({
              _id: project._id
            }, done);
          });

          it('should return a 400', function(done) {

            agent
              .post('/invitations')
              .set('x-access-token', auth.token)
              .send({
                projectId: project._id,
                userId: '123'
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
                errorMessage.should.equal('User not found');

                done();
              });
          });
        });

        describe('when inviting user does not have permission to invite new users', function() {
          var email = 'testuser@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var invitingUser = null;
          var invitedUser = null;
          var auth = null;
          var project = null;

          before(function(done) {
            async.series([
              function createInvitingUser_step(cb) {
                userService.createUsingCredentials({
                  email: email,
                  password: password
                }, function(err, _user) {
                  if (err) return cb(err);

                  invitingUser = _user;
                  cb();
                });
              },
              function createInvitedUser_step(cb) {
                userService.createUsingCredentials({
                  email: email2,
                  password: password
                }, function(err, _user) {
                  if (err) return cb(err);

                  invitedUser = _user;
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
              function createProject_step(cb) {
                projectService.create({
                  name: 'Project 1',
                  shortDescription: 'Foo',
                  createdByUserId: invitingUser._id
                }, function(err, _project) {
                  if (err) return cb(err);

                  project = _project;

                  var projectUserId = project.projectUsers[0];

                  ProjectUser.findById(projectUserId, function(err, projectUser) {
                    if (err) return cb(err);

                    projectUser.permissions = [];
                    projectUser.save(cb);
                  });
                })
              }
            ], done);
          });

          after(function(done) {
            User.remove({
              email: {
                $in: [email, email2]
              }
            }, done);
          });

          after(function(done) {
            Auth.remove({
              user: invitingUser._id
            }, done);
          });

          after(function(done) {
            Project.remove({
              _id: project._id
            }, done);
          });

          it('should return a 403', function(done) {

            agent
              .post('/invitations')
              .set('x-access-token', auth.token)
              .send({
                projectId: project._id,
                userId: invitedUser._id
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

        describe('when all data is valid', function() {
          var email = 'testuser@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var invitingUser = null;
          var invitedUser = null;
          var auth = null;
          var project = null;

          var createInvitationSpy;

          before(function(done) {

            createInvitationSpy = sandbox.spy();

            invitationService.on(INVITATION_EVENTS.INVITATION_CREATED, createInvitationSpy);

            async.series([
              function createInvitingUser_step(cb) {
                userService.createUsingCredentials({
                  email: email,
                  password: password
                }, function(err, _user) {
                  if (err) return cb(err);

                  invitingUser = _user;
                  cb();
                });
              },
              function createInvitedUser_step(cb) {
                userService.createUsingCredentials({
                  email: email2,
                  password: password
                }, function(err, _user) {
                  if (err) return cb(err);

                  invitedUser = _user;
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
                projectService.create({
                  name: 'Project 1',
                  shortDescription: 'Foo',
                  createdByUserId: invitingUser._id
                }, function(err, _project) {
                  if (err) return cb(err);

                  project = _project;

                  cb();
                })
              }
            ], done);
          });

          after(function(done) {
            User.remove({
              email: {
                $in: [email, email2]
              }
            }, done);
          });

          after(function(done) {
            Auth.remove({
              user: invitingUser._id
            }, done);
          });

          after(function(done) {
            Project.remove({
              _id: project._id
            }, done);
          });

          it('should return a 400', function(done) {

            agent
              .post('/invitations')
              .set('x-access-token', auth.token)
              .send({
                projectId: project._id,
                userId: invitedUser._id
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var status = response.status;
                status.should.equal(201);

                var invitation = response.body;
                should.exist(invitation);

                invitation.project.should.equal(project._id);
                invitation.user.should.equal(invitedUser._id);
                invitation.status.should.equal(INVITATION_STATUSES.PENDING);

                createInvitationSpy.callCount.should.equal(1);

                done();
              });
          });
        });
      });
    });
  });
});
