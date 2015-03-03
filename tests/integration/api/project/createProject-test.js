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

var User = require('modules/user/data/model');
var Admin = require('modules/admin/data/model');
var Auth = require('modules/auth/data/model');
var Project = require('modules/project/data/model');
var ProjectUser = require('modules/project-user/data/model');
var Permission = require('modules/permission/data/model');

var PERMISSIONS_NAMES = require('modules/permission/constants/permission-names');

var agent;

/* =========================================================================
 * Before All
 * ========================================================================= */

before(function(done) {
  agent = require('tests/lib/agent').getAgent();

  done();
});

describe('api', function() {
  describe('user', function() {
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

      describe('when valid data is passed', function() {
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
                    return perm.name === PERMISSIONS_NAMES.ADD_PROJECT_USERS;
                  });

                  should.exist(addUserPermissions);

                  done();
                });
              });
            });
        });
      });
    });
  });
});
