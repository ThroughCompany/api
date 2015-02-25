/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/integration/before-all');

var should = require('should');
var async = require('async');

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
    describe('GET - /users/{id}/projects', function() {
      describe('when user is not authenticated', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;

        before(function(done) {
          userService.createUsingCredentials({
            email: email,
            password: password
          }, function(err, _user) {
            user = _user;
            done();
          });
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

        it('should return a 401', function(done) {

          agent
            .get('/users/123/projects')
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

      describe('when user is not an admin', function() {
        var email = 'testuser1@test.com';
        var password = 'password';
        var projectName = 'Project 1';
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
                name: projectName
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
            _id: user._id
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

        it('should return a list of projects', function(done) {

          agent
            .get('/users/' + user._id + '/projects')
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);
              should.exist(response);

              var status = response.status;
              status.should.equal(200);

              var projects = response.body;

              should.exist(projects);
              projects.length.should.equal(1);

              done();
            });
        });
      });

      describe('when user is authenticated and is an admin', function() {
        var email = 'testuser2@test.com';
        var password = 'password';
        var projectName = 'Project 1';
        var user = null;
        var admin = null;
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
            function createAdmin_step(cb) {
              adminService.create({
                userId: user._id
              }, function(err, _admin) {
                if (err) return cb(err);

                admin = _admin;
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
                name: projectName
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
          Admin.remove({
            user: user._id
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

        it('should return a list of projects', function(done) {

          agent
            .get('/users/' + user._id + '/projects')
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);
              should.exist(response);

              var status = response.status;
              status.should.equal(200);

              var users = response.body;

              users.length.should.equal(1);

              done();
            });
        });
      });
    });
  });
});
