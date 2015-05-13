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
var needService = require('modules/need');
var organizationService = require('modules/organization');
var projectService = require('modules/project');

var User = require('modules/user/data/model');
var Auth = require('modules/auth/data/model');
var Admin = require('modules/admin/data/model');
var Organization = require('modules/organization/data/organizationModel');
var Project = require('modules/project/data/projectModel');
var Need = require('modules/need/data/needModel');

var agent;

/* =========================================================================
 * Before All
 * ========================================================================= */

before(function(done) {
  agent = require('tests/lib/agent').getAgent();

  done();
});

describe('api', function() {
  describe('need', function() {
    describe('PATCH - /needs/{id}', function() {
      describe('when user is not authenticated', function() {
        it('should return a 401', function(done) {

          agent
            .patch('/needs/345')
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

      describe('organization need', function() {
        describe('when trying to update an organization need when they aren\'t a member of the organization and is not an admin', function() {
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
              function createOrganizationStep_step(cb) {
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
              .patch('/needs/345')
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

      describe('project need', function() {
        describe('when trying to update an project need when they aren\'t a member of the project and is not an admin', function() {
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
              function createProjectStep_step(cb) {
                projectService.create({
                  createdByUserId: user2._id,
                  name: 'Project 1',
                  shortDescription: 'FOobar'
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
              .patch('/needs/345')
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
      });

      describe('user need', function() {
        describe('when trying to update a user need when it\'s not their need and they are not an admin', function() {
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
              .patch('/needs/345')
              .set('x-access-token', auth.token)
              .send({
                userId: '1234'
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

      describe('when no updates are passed', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;
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
              organizationService.create({
                createdByUserId: user._id,
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
            email: email
          }, done);
        });

        after(function(done) {
          Auth.remove({
            user: user._id
          }, done);
        });

        after(function(done) {
          Organization.remove({
            _id: organization._id
          }, done);
        });

        it('should return a 400', function(done) {
          agent
            .patch('/needs/345')
            .send({
              organizationId: organization._id,
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
        var organization = null;
        var need = null;

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
              organizationService.create({
                createdByUserId: user._id,
                name: 'Org 1'
              }, function(err, _organization) {
                if (err) return cb(err);

                organization = _organization;
                cb();
              });
            },
            function createNeed_step(cb) {
              needService.create({
                organizationId: organization._id,
                name: 'Programmer',
                description: 'Node js programmer',
                skills: ['HTML5']
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
            email: email
          }, done);
        });

        after(function(done) {
          Auth.remove({
            user: user._id
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

        it('should ignore any non-updateable properties', function(done) {

          var needClone = _.clone(need.toJSON());

          needClone._id = '123';

          var patches = diff.diff(need.toJSON(), needClone);

          agent
            .patch('/needs/' + need._id)
            .send({
              organizationId: organization._id,
              patches: patches
            })
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);

              var status = response.status;
              status.should.equal(200);

              var updatedNeed = response.body;
              should.exist(updatedNeed);

              Need.findById(updatedNeed._id, function(err, foundNeed) {
                if (err) return done(err);

                foundNeed._id.should.equal(need._id);

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
        var need = null;

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
              needService.create({
                projectId: project._id,
                name: 'Programmer',
                description: 'Node js programmer',
                timeCommitment: {
                  hoursPerWeek: 20
                },
                skills: ['HTML5']
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
          Need.remove({
            _id: need._id
          }, done);
        });

        it('should update properties', function(done) {

          var needClone = _.clone(need.toJSON());

          //var newNeedStartDate = moment().add(1, 'month');

          needClone.name = '123';
          needClone.description = 'new description';
          needClone.locationSpecific = true;
          needClone.timeCommitment.totalHours = 200;
          needClone.timeCommitment.hoursPerWeek = 0;

          var patches = diff.diff(need.toJSON(), needClone);

          agent
            .patch('/needs/' + need._id)
            .send({
              projectId: project._id,
              patches: patches
            })
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);

              var status = response.status;
              status.should.equal(200);

              var updatedNeed = response.body;
              should.exist(updatedNeed);

              Need.findById(need._id, function(err, foundNeed) {
                if (err) return done(err);

                foundNeed.name.should.equal('123');
                foundNeed.description.should.equal('new description');
                foundNeed.locationSpecific.should.equal(true);
                foundNeed.timeCommitment.totalHours.should.equal(200);
                foundNeed.timeCommitment.hoursPerWeek.should.equal(0);

                done();
              });
            });
        });
      });
    });
  });
});
