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
var ProjectNeed = require('modules/project/data/needModel');

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
    describe('PATCH - /projects/{id}/needs/{needId}', function() {
      describe('when user is not authenticated', function() {
        it('should return a 401', function(done) {

          agent
            .patch('/projects/123/needs/345')
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

      describe('when trying to update a project need when they aren\'t a member of the project and is not an admin', function() {
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
            .patch('/projects/' + project._id + '/needs/345')
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
            .patch('/projects/' + project._id + '/needs/345')
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
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;
        var auth = null;
        var project = null;
        var projectNeed = null;

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
            function createProject_step(cb) {
              projectService.create({
                createdByUserId: user._id,
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
          ProjectNeed.remove({
            _id: projectNeed._id
          }, done);
        });

        it('should ignore any non-updateable properties', function(done) {

          var projectNeedClone = _.clone(projectNeed.toJSON());

          projectNeedClone._id = '123';

          var patches = diff.diff(projectNeed.toJSON(), projectNeedClone);

          agent
            .patch('/projects/' + project._id + '/needs/' + projectNeed._id)
            .send({
              patches: patches
            })
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);

              var status = response.status;
              status.should.equal(200);

              var updatedProjectNeed = response.body;
              should.exist(updatedProjectNeed);

              ProjectNeed.findById(projectNeed._id, function(err, foundProjectNeed) {
                if (err) return done(err);

                foundProjectNeed._id.should.equal(projectNeed._id);

                done();
              });
            });
        });
      });

      describe('when updates are valid', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;
        var auth = null;
        var project = null;
        var projectNeed = null;

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
            function createProject_step(cb) {
              projectService.create({
                createdByUserId: user._id,
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
                timeCommitment: {
                  hoursPerWeek: 20
                },
                // duration: {
                //   startDate: new Date(),
                //   endDate: new Date()
                // },
                skills: ['HTML5']
              }, function(err, _projectNeed) {
                if (err) return cb(err);

                projectNeed = _projectNeed;
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
          ProjectNeed.remove({
            _id: projectNeed._id
          }, done);
        });

        it('should update properties', function(done) {

          var projectNeedClone = _.clone(projectNeed.toJSON());

          //var newNeedStartDate = moment().add(1, 'month');

          projectNeedClone.name = '123';
          projectNeedClone.description = 'new description';
          projectNeedClone.locationSpecific = true;
          projectNeedClone.timeCommitment.totalHours = 200;
          projectNeedClone.timeCommitment.hoursPerWeek = 0;
          //projectNeedClone.duration.startDate = newNeedStartDate;

          var patches = diff.diff(projectNeed.toJSON(), projectNeedClone);

          agent
            .patch('/projects/' + project._id + '/needs/' + projectNeed._id)
            .send({
              patches: patches
            })
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);

              var status = response.status;
              status.should.equal(200);

              var updatedProjectNeed = response.body;
              should.exist(updatedProjectNeed);

              ProjectNeed.findById(projectNeed._id, function(err, foundProjectNeed) {
                if (err) return done(err);

                foundProjectNeed.name.should.equal('123');
                foundProjectNeed.description.should.equal('new description');
                foundProjectNeed.locationSpecific.should.equal(true);
                foundProjectNeed.timeCommitment.totalHours.should.equal(200);
                foundProjectNeed.timeCommitment.hoursPerWeek.should.equal(0);
                // foundProjectNeed.duration.startDate.should.equal(newNeedStartDate);

                done();
              });
            });
        });
      });
    });
  });
});
