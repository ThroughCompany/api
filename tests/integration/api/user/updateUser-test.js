/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/integration/before-all');

var should = require('should');
var async = require('async');
var jsonPatch = require('fast-json-patch');
var _ = require('underscore');

var app = require('src');
var appConfig = require('src/config/app-config');

var utils = require('utils/utils');
var testUtils = require('tests/lib/test-utils');

var userService = require('modules/user');
var authService = require('modules/auth');
var adminService = require('modules/admin');

var User = require('modules/user/data/model');
var Auth = require('modules/auth/data/model');
var Admin = require('modules/admin/data/model');

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
    describe('PATCH - /users/{id}', function() {
      describe('when user is not authenticated', function() {
        it('should return a 401', function(done) {

          agent
            .patch('/users/123')
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

      describe('when user is trying to update another user and is not an admin', function() {
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

        it('should return a 403', function(done) {
          agent
            .patch('/users/123')
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);

              var error = response.body;
              should.exist(error);

              var status = response.status;
              status.should.equal(403);

              var errorMessage = testUtils.getServerErrorMessage(response);

              should.exist(errorMessage);
              errorMessage.should.equal('Current user id does not match user id param');

              done();
            });
        });
      });

      describe('when no updates are passed', function() {
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

        it('should return a 403', function(done) {
          agent
            .patch('/users/' + user._id)
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

        describe('invalid link type', function() {
          it('should update the user', function(done) {

            var userClone = _.clone(user.toJSON());

            var observer = jsonPatch.observe(userClone);

            userClone.socialLinks.push({
              type: 'FOOBAR',
              name: 'FOOBAR',
              link: 'http://wwwasfasd',
            });

            var patches = jsonPatch.generate(observer);

            agent
              .patch('/users/' + user._id)
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
          it('should update the user', function(done) {

            var userClone = _.clone(user.toJSON());

            var observer = jsonPatch.observe(userClone);

            userClone.socialLinks.push({
              type: 'GITHUB',
              name: 'FOOBAR',
              link: 'http://wwwasfasd'
            });

            var patches = jsonPatch.generate(observer);

            agent
              .patch('/users/' + user._id)
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

        it('should ignore any non-updateable properties', function(done) {

          var userClone = _.clone(user.toJSON());

          var observer = jsonPatch.observe(userClone);

          userClone._id = '123';
          userClone.email = 'FOOOBARRRR';
          userClone.userName = 'BARFOO';
          userClone.projectUsers = [{
            foo: 1
          }];
          userClone.projectApplications = [{
            bar: 1
          }];
          userClone.assetTags = [{
            bar: 1
          }];
          userClone.images = [{
            foo: 1
          }];
          userClone.profilePic = '1111';
          userClone.active = false;

          var patches = jsonPatch.generate(observer);

          agent
            .patch('/users/' + user._id)
            .send({
              patches: patches
            })
            .set('x-access-token', auth.token)
            .end(function(err, response) {
              should.not.exist(err);

              var status = response.status;
              status.should.equal(200);

              var updatedUser = response.body;
              should.exist(updatedUser);

              User.findById(user._id, function(err, foundUser) {
                if (err) return done(err);

                foundUser._id.should.equal(user._id);
                foundUser.email.should.equal(user.email);
                foundUser.userName.should.equal(user.userName);
                utils.arraysAreEqual(foundUser.projectUsers, user.projectUsers).should.equal(true);
                utils.arraysAreEqual(foundUser.projectApplications, user.projectApplications).should.equal(true);
                utils.arraysAreEqual(foundUser.assetTags, user.assetTags).should.equal(true);
                foundUser.profilePic.should.equal(user.profilePic);
                foundUser.active.should.equal(user.active);

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

          it('should update the user\'s first and last name', function(done) {

            var userClone = _.clone(user.toJSON());

            var observer = jsonPatch.observe(userClone);

            userClone.firstName = 'Larry';
            userClone.lastName = 'Peterson';

            var patches = jsonPatch.generate(observer);

            agent
              .patch('/users/' + user._id)
              .send({
                patches: patches
              })
              .set('x-access-token', auth.token)
              .end(function(err, response) {
                should.not.exist(err);

                var status = response.status;
                status.should.equal(200);

                var user = response.body;
                should.exist(user);

                user.firstName.should.equal('Larry');
                user.lastName.should.equal('Peterson');

                done();
              });
          });
        });

        describe('link is added', function() {
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

          it('should add a link to the user\'s socialLinks', function(done) {

            var userClone = _.clone(user.toJSON());

            var observer = jsonPatch.observe(userClone);

            userClone.socialLinks.push({
              type: 'GITHUB',
              name: 'Codez',
              link: 'https://www.github.com'
            });

            var patches = jsonPatch.generate(observer);

            agent
              .patch('/users/' + user._id)
              .send({
                patches: patches
              })
              .set('x-access-token', auth.token)
              .end(function(err, response) {
                should.not.exist(err);

                var status = response.status;
                status.should.equal(200);

                var user = response.body;
                should.exist(user);

                user.socialLinks.length.should.equal(1);
                user.socialLinks[0].type.should.equal('GITHUB');
                user.socialLinks[0].link.should.equal('https://www.github.com');
                user.socialLinks[0].name.should.equal('Codez');

                done();
              });
          });
        });

        describe('link is removed', function() {
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
                  user.socialLinks.push({
                    type: 'GITHUB',
                    name: 'Codez',
                    link: 'https://www.github.com'
                  });
                  user.save(cb);
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

          it('should add a link to the user\'s socialLinks', function(done) {

            var userClone = _.clone(user.toJSON());

            var observer = jsonPatch.observe(userClone);

            userClone.socialLinks.splice(0, 1);

            var patches = jsonPatch.generate(observer);

            agent
              .patch('/users/' + user._id)
              .send({
                patches: patches
              })
              .set('x-access-token', auth.token)
              .end(function(err, response) {
                should.not.exist(err);

                var status = response.status;
                status.should.equal(200);

                var user = response.body;
                should.exist(user);

                user.socialLinks.length.should.equal(0);

                done();
              });
          });
        });
      });

    });
  });
});
