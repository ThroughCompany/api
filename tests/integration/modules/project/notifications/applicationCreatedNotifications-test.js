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

//services
var userService = require('modules/user');
var adminService = require('modules/admin');
var authService = require('modules/auth');
var projectService = require('modules/project');
var projectNotificationService = require('modules/project/notificationService');
var needService = require('modules/need');
var applicationService = require('modules/application');

//models
var User = require('modules/user/data/model');
var Admin = require('modules/admin/data/model');
var Auth = require('modules/auth/data/model');
var Project = require('modules/project/data/projectModel');
var ProjectUser = require('modules/project/data/userModel');
var Need = require('modules/need/data/needModel');
var Application = require('modules/application/data/applicationModel');

//libs
var mailgunApi = require('lib/mailgun-api');

var agent;
var sandbox = sinon.sandbox.create();

/* =========================================================================
 * Before All
 * ========================================================================= */
describe('modules', function() {
  describe('project', function() {
    describe('notifications', function() {
      describe('applicationCreated', function() {
        after(function(next) {
          sandbox.restore();

          next();
        });

        describe('when not all data is passed', function() {
          it('should return an error', function(done) {
            projectNotificationService.sendApplicationCreatedNotifications({
              foobar: ''
            }, function(err) {
              should.exist(err);

              err.message.should.equal('Project Id is required');

              done();
            });
          });
        });

        describe('when project application does not exist', function() {
          it('should return an error', function(done) {
            projectNotificationService.sendApplicationCreatedNotifications({
              applicationId: '12345',
              projectId: '12345',
              createdByUserId: '12345'
            }, function(err) {
              should.exist(err);

              err.message.should.equal('Application not found');

              done();
            });
          });
        });

        describe('when user does not exist', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var auth = null;
          var project = null;
          var need = null;
          var application = null;

          var sendApplicationCreatedNotificationsStub;

          before(function(done) {

            sendApplicationCreatedNotificationsStub = sandbox.stub(projectNotificationService, 'sendApplicationCreatedNotifications', function(options, callback) {
              return callback(null);
            });

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
                  name: 'Project 1',
                  description: 'FOobar',
                  skills: ['Programming']
                }, function(err, _need) {
                  if (err) return cb(err);

                  need = _need;
                  cb();
                });
              },
              function applyToProject_step(cb) {
                applicationService.create({
                  projectId: project._id,
                  createdByUserId: user2._id,
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

          it('should return an error', function(done) {
            projectNotificationService.sendApplicationCreatedNotifications.restore();

            projectNotificationService.sendApplicationCreatedNotifications({
              applicationId: application._id,
              projectId: project._id,
              createdByUserId: '12345'
            }, function(err) {
              should.exist(err);

              err.message.should.equal('User not found');

              done();
            });
          });
        });

        describe('when all data is valid', function() {
          var email1 = 'testuser1@test.com';
          var email2 = 'testuser2@test.com';
          var password = 'password';
          var user1 = null;
          var auth = null;
          var project = null;
          var need = null;
          var application = null;

          var sendApplicationCreatedNotificationsStub;
          var mailGunApiSendEmailStub;

          before(function(done) {

            sendApplicationCreatedNotificationsStub = sandbox.stub(projectNotificationService, 'sendApplicationCreatedNotifications', function(options, callback) {
              return callback(null);
            });

            mailGunApiSendEmailStub = sandbox.stub(mailgunApi, 'sendEmail', function(options, callback) {
              return callback(null);
            });

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
                  name: 'Project 1',
                  description: 'FOobar',
                  skills: ['Programming']
                }, function(err, _need) {
                  if (err) return cb(err);

                  need = _need;
                  cb();
                });
              },
              function applyToProject_step(cb) {
                applicationService.create({
                  projectId: project._id,
                  createdByUserId: user2._id,
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
            ProjectUser.remove({
              project: project._id,
              user: user1._id
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

          it('should send an email to all the users with the ADD_PROJECT_USERS permission', function(done) {
            projectNotificationService.sendApplicationCreatedNotifications.restore();

            projectNotificationService.sendApplicationCreatedNotifications({
              applicationId: application._id,
              projectId: project._id,
              createdByUserId: user2._id
            }, function(err, notifiedUserIds) {
              should.not.exist(err);
              should.exist(notifiedUserIds);

              mailGunApiSendEmailStub.callCount.should.equal(3);

              notifiedUserIds.length.should.equal(1);

              _.contains(notifiedUserIds, user1._id).should.equal(true);

              done();
            });
          });
        });
      });
    });
  });
});
