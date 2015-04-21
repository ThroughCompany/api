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
var organizationService = require('modules/organization');

var User = require('modules/user/data/model');
var Admin = require('modules/admin/data/model');
var Auth = require('modules/auth/data/model');
var Organization = require('modules/organization/data/organizationModel');
var OrganizationUser = require('modules/organization/data/userModel');
var Permission = require('modules/permission/data/model');

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
  describe('organization', function() {
    describe('POST - /organizations', function() {
      describe('when user is not authenticated', function() {
        var email = 'testuser@test.com';
        var password = 'password';
        var user = null;

        it('should return a 401', function(done) {
          agent
            .post('/organizations')
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
            .post('/organizations')
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
        describe('and user does not already have organizations', function() {
          var email = 'testuser@test.com';
          var password = 'password';
          var user = null;
          var auth = null;

          var organizationName = 'Organization FOOBAR';

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
            Organization.remove({
              name: organizationName
            }, done);
          });

          it('should create a new organization and create a new organization user with permissions', function(done) {

            agent
              .post('/organizations')
              .set('x-access-token', auth.token)
              .send({
                name: organizationName,
                shortDescription: 'short description'
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var status = response.status;
                status.should.equal(201);

                var newOrganization = response.body;
                should.exist(newOrganization);

                newOrganization.name.should.equal(organizationName);
                newOrganization.organizationUsers.length.should.equal(1);

                var organizationUserId = newOrganization.organizationUsers[0];

                OrganizationUser.findById(organizationUserId, function(err, organizationUser) {
                  if (err) return next(err);

                  should.exist(organizationUser);

                  organizationUser.user.should.equal(user._id);

                  Permission.find({
                    _id: {
                      $in: organizationUser.permissions
                    }
                  }, function(err, permissions) {
                    if (err) return next(err);

                    var addUserPermissions = _.find(permissions, function(perm) {
                      return perm.name === PERMISSION_NAMES.ADD_ORGANIZATION_USERS;
                    });

                    should.exist(addUserPermissions);

                    done();
                  });
                });
              });
          });
        });


        describe('and user does not already have organizations', function() {
          var email = 'testuser@test.com';
          var password = 'password';
          var user = null;
          var auth = null;

          var organization = null;

          var organizationName = 'Organization FOOBAR';

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
              function create1rstOrganization_step(cb) {
                organizationService.create({
                  createdByUserId: user._id,
                  name: 'Blah'
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
              $or: [{
                name: organizationName
              }, {
                _id: organization._id
              }]
            }, done);
          });

          it('should create a new organization and create another new organization user for the user', function(done) {

            agent
              .post('/organizations')
              .set('x-access-token', auth.token)
              .send({
                name: organizationName
              })
              .end(function(err, response) {
                should.not.exist(err);
                should.exist(response);

                var status = response.status;
                status.should.equal(201);

                var newOrganization = response.body;
                should.exist(newOrganization);

                OrganizationUser.find({
                  user: user._id
                }, function(err, organizationUsers) {
                  if (err) return next(err);

                  should.exist(organizationUsers);

                  organizationUsers.length.should.equal(2);

                  done();
                });
              });
          });
        });
      });
    });
  });
});
