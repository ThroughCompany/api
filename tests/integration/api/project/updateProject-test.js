/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/integration/before-all');

var should = require('should');
var async = require('async');
var diff = require('rfc6902');
var _ = require('underscore');

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
    describe('PATCH - /projects/{id}', function() {
      describe('when user is not authenticated', function() {
        it('should return a 401', function(done) {

          agent
            .patch('/projects/123')
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

      describe('when trying to update a project they aren\'t a member of and is not an admin', function() {
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
            .patch('/projects/' + project._id)
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
            .patch('/projects/' + project._id)
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

      describe('when socialLinks are invalid', function() {
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

        describe('invalid link type', function() {
          it('should return an error', function(done) {

            var projectClone = _.clone(project.toJSON());

            projectClone.socialLinks.push({
              type: 'FOOBAR',
              name: 'FOOBAR',
              link: 'http://wwwasfasd'
            });

            var patches = diff.diff(project.toJSON(), projectClone);

            agent
              .patch('/projects/' + project._id)
              .send({
                patches: patches
              })
              .set('x-access-token', auth.token)
              .end(function(err, response) {
                should.not.exist(err);

                var status = response.status;
                status.should.equal(400);

                var errorMessage = testUtils.getServerErrorMessage(response);

                should.exist(errorMessage);
                errorMessage.should.equal('FOOBAR is not a valid link type');

                done();
              });
          });
        });

        describe('invalid link url', function() {
          it('should return an error', function(done) {

            var projectClone = _.clone(project.toJSON());

            projectClone.socialLinks.push({
              type: 'GITHUB',
              name: 'FOOBAR',
              link: 'http://wwwasfasd'
            });

            var patches = diff.diff(project.toJSON(), projectClone);

            agent
              .patch('/projects/' + project._id)
              .send({
                patches: patches
              })
              .set('x-access-token', auth.token)
              .end(function(err, response) {
                should.not.exist(err);

                var status = response.status;
                status.should.equal(400);

                var errorMessage = testUtils.getServerErrorMessage(response);

                should.exist(errorMessage);
                errorMessage.should.equal('Social Links must be valid links');

                done();
              });
          });
        });
      });

      describe('when trying to update non-updateable properties', function() {
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

        it('should ignore any non-updateable properties', function(done) {

          var projectClone = _.clone(project.toJSON());

          projectClone._id = '123';
          projectClone.slug = 'FOOOBARRRR';
          projectClone.wiki = 'BARFOO';
          projectClone.projectUsers = [{
            foo: 1
          }];
          projectClone.projectApplications = [{
            bar: 1
          }];
          projectClone.skills = [{
            bar: 1
          }];
          projectClone.profilePic = '1111';

          var patches = diff.diff(project.toJSON(), projectClone);

          agent
            .patch('/projects/' + project._id)
            .send({
              patches: patches
            })
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);

              var status = response.status;
              status.should.equal(200);

              var updateProject = response.body;
              should.exist(updateProject);

              Project.findById(project._id, function(err, foundProject) {
                if (err) return done(err);

                foundProject._id.should.equal(project._id);
                foundProject.slug.should.equal(project.slug);
                utils.arraysAreEqual(foundProject.wiki, project.wiki).should.equal(true);
                utils.arraysAreEqual(foundProject.projectUsers, project.projectUsers).should.equal(true);
                utils.arraysAreEqual(foundProject.projectApplications, project.projectApplications).should.equal(true);
                utils.arraysAreEqual(foundProject.skills, project.skills).should.equal(true);
                foundProject.profilePic.should.equal(project.profilePic);

                done();
              });
            });
        });
      });

      describe('when updates are valid', function() {
        describe('first and last names are updated', function() {
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

          it('should update the project\'s name and description', function(done) {

            var projectClone = _.clone(project.toJSON());

            projectClone._id = '123';
            projectClone.name = 'New Project Name';
            projectClone.description = 'New Project Description';

            var patches = diff.diff(project.toJSON(), projectClone);

            agent
              .patch('/projects/' + project._id)
              .send({
                patches: patches
              })
              .set('x-access-token', auth.token)
              .end(function(err, response) {
                should.not.exist(err);

                var status = response.status;
                status.should.equal(200);

                var project = response.body;
                should.exist(project);

                project.name.should.equal('New Project Name');
                project.description.should.equal('New Project Description');

                done();
              });
          });
        });

        describe('link is added', function() {
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

          it('should add a link to the user\'s socialLinks', function(done) {

            var projectClone = _.clone(project.toJSON());

            projectClone.socialLinks.push({
              type: 'GITHUB',
              name: 'Codez',
              link: 'https://www.github.com'
            });

            var patches = diff.diff(project.toJSON(), projectClone);

            agent
              .patch('/projects/' + project._id)
              .send({
                patches: patches
              })
              .set('x-access-token', auth.token)
              .end(function(err, response) {
                should.not.exist(err);

                var status = response.status;
                status.should.equal(200);

                var project = response.body;
                should.exist(user);

                project.socialLinks.length.should.equal(1);
                project.socialLinks[0].type.should.equal('GITHUB');
                project.socialLinks[0].link.should.equal('https://www.github.com');
                project.socialLinks[0].name.should.equal('Codez');

                done();
              });
          });
        });

        describe('link is removed', function() {
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
              function createProject_step(cb) {
                projectService.create({
                  createdByUserId: user._id,
                  name: 'Project 1',
                  shortDescription: 'short desc'
                }, function(err, _project) {
                  if (err) return cb(err);

                  project = _project;

                  project.socialLinks.push({
                    type: 'GITHUB',
                    name: 'Codez',
                    link: 'https://www.github.com'
                  });

                  project.save(cb);
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

          it('should add a link to the user\'s socialLinks', function(done) {

            var projectClone = _.clone(project.toJSON());

            projectClone.socialLinks.splice(0, 1);

            var patches = diff.diff(project.toJSON(), projectClone);

            agent
              .patch('/projects/' + project._id)
              .send({
                patches: patches
              })
              .set('x-access-token', auth.token)
              .end(function(err, response) {
                should.not.exist(err);

                var status = response.status;
                status.should.equal(200);

                var project = response.body;
                should.exist(project);

                project.socialLinks.length.should.equal(0);

                done();
              });
          });
        });
      });
    });
  });
});
