/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');

var app = require('src');

var Auth;
var User;
var Admin;
var Role;
var Permission;

var authService;
var userService;
var adminService;

var logger;

var ROLE_NAMES;
var PERMISSION_NAMES;

/* =========================================================================
 * Db Seed
 * ========================================================================= */
var steps = [];

function dbSeed(options, next) {
  console.log('--------------------------------------------\nRUNNING DB SEED STEPS...\n--------------------------------------------');

  if (options.createAdmins === false) { //remove the create sys admins steps
    steps.splice(1, 1);
  }

  runSteps(steps, function() {

    console.log('\n--------------------------------------------\nFINISHED RUNNING DB SEED STEPS...\n--------------------------------------------');

    next();
  });
}

/* =========================================================================
 * Constants
 * ========================================================================= */
var SYS_ADMIN_EMAIL = 'admin@throughcompany.com';
var SYS_ADMIN_PASSWORD = 'throughcompany'; //TODO: make this a harder password

/* =========================================================================
 * Steps
 * ========================================================================= */
steps.push(function loadDependencies_step(done) {
  Auth = require('modules/auth/data/model');
  Admin = require('modules/admin/data/model');
  User = require('modules/user/data/model');
  Role = require('modules/role/data/model');
  Permission = require('modules/permission/data/model');

  authService = require('modules/auth');
  userService = require('modules/user');
  adminService = require('modules/admin');

  logger = require('modules/logger');

  ROLE_NAMES = require('modules/role/constants/roleNames');
  PERMISSION_NAMES = require('modules/permission/constants/permissionNames');

  done();
});

steps.push(function createSysAdminUser_step(done) {
  async.waterfall([
    function lookForExistingSysAdminByEmail_step(done) {
      User.find({
        email: SYS_ADMIN_EMAIL
      }, done);
    },
    function createAdmin_step(users, done) {
      if (users && users.length) {
        logger.info('sys admin already exists, skipping...');
        return done(); // skip this step, sys admin already exists
      }

      logger.info('creating sys admin...');

      userService.createUsingCredentials({
        email: SYS_ADMIN_EMAIL,
        password: SYS_ADMIN_PASSWORD
      }, function(err, newUser) {
        if (err) return done(err);

        adminService.create({
          userId: newUser._id
        }, done);
      });
    }
  ], done);
});

steps.push(function createRolesAndPermissions_step(done) {

  var _steps = [];

  //roles names
  //var PROJECT_ADMIN_ROLE_NAME = 'Project Admin';

  //permission names
  //var PROJECT_ADD_USERS_PERMISSION_NAME = 'Add Project Users';

  var organizationAdminRole;
  var projectAdminRole;
  var projectMemberRole;

  var addOrganizationUsersPermission;
  var addProjectUsersPermission;

  //look for existing roles and permissions
  _steps.push(function cleanUpExistingRolesAndPermissions_step(cb1) {
    async.series([
      //find roles
      function findProjectAdminRole_step(cb2) {
        async.parallel([
          function(cb3) {
            Role.findOne({
              name: ROLE_NAMES.ORGANIZATION_ADMIN
            }, function(err, role) {
              if (err) return cb3(err);
              if (role) organizationAdminRole = role;
              cb3();
            });
          },
          function(cb3) {
            Role.findOne({
              name: ROLE_NAMES.PROJECT_ADMIN
            }, function(err, role) {
              if (err) return cb3(err);
              if (role) projectAdminRole = role;
              cb3();
            });
          },
          function(cb3) {
            Role.findOne({
              name: ROLE_NAMES.PROJECT_MEMBER
            }, function(err, role) {
              if (err) return cb3(err);
              if (role) projectMemberRole = role;
              cb3();
            });
          }
        ], cb2);
      },
      //find permissions
      function findAddProjectUserPermission_step(cb2) {
        async.parallel([
          function(cb3) {
            Permission.findOne({
              name: PERMISSION_NAMES.ADD_ORGANIZATION_USERS
            }, function(err, permission) {
              if (err) return cb3(err);
              if (permission) addOrganizationUsersPermission = permission;
              cb3();
            });
          },
          function(cb3) {
            Permission.findOne({
              name: PERMISSION_NAMES.ADD_PROJECT_USERS
            }, function(err, permission) {
              if (err) return cb3(err);
              if (permission) addProjectUsersPermission = permission;
              cb3();
            });
          }
        ], cb2);
      }
    ], cb1);
  });

  //create roles
  _steps.push(function createRoles_step(cb1) {
    async.series([
      function createOrganizationAdminRole_step(cb2) {
        if (!organizationAdminRole) {
          logger.info('creating role: ' + ROLE_NAMES.ORGANIZATION_ADMIN);

          var _organizationAdminRole = new Role();
          _organizationAdminRole.name = ROLE_NAMES.ORGANIZATION_ADMIN;

          _organizationAdminRole.save(function(err, role) {
            if (err) return cb2(err);
            organizationAdminRole = role;
            cb2();
          });
        } else {
          logger.info('role: ' + ROLE_NAMES.ORGANIZATION_ADMIN + ' found, skipping...');
          cb2();
        }
      },
      function createProjectAdminRole_step(cb2) {
        if (!projectAdminRole) {
          logger.info('creating role: ' + ROLE_NAMES.PROJECT_ADMIN);

          var _projectAdminRole = new Role();
          _projectAdminRole.name = ROLE_NAMES.PROJECT_ADMIN;

          _projectAdminRole.save(function(err, role) {
            if (err) return cb2(err);
            projectAdminRole = role;
            cb2();
          });
        } else {
          logger.info('role: ' + ROLE_NAMES.PROJECT_ADMIN + ' found, skipping...');
          cb2();
        }
      },
      function createProjectMemberRole_step(cb2) {
        if (!projectMemberRole) {
          logger.info('creating role: ' + ROLE_NAMES.PROJECT_MEMBER);

          var _projectMemberRole = new Role();
          _projectMemberRole.name = ROLE_NAMES.PROJECT_MEMBER;

          _projectMemberRole.save(function(err, role) {
            if (err) return cb2(err);
            projectMemberRole = role;
            cb2();
          });
        } else {
          logger.info('role: ' + ROLE_NAMES.PROJECT_MEMBER + ' found, skipping...');
          cb2();
        }
      }
    ], cb1);
  });

  //create permissions and assign them roles
  _steps.push(function createPermissions_step(cb1) {
    async.series([
      function createOrganizationAdminPermissions_step(cb2) {
        if (!addOrganizationUsersPermission) {
          logger.info('creating permission: ' + PERMISSION_NAMES.ADD_ORGANIZATION_USERS);

          var _addOrganizationUsersPermission = new Permission();
          _addOrganizationUsersPermission.name = PERMISSION_NAMES.ADD_ORGANIZATION_USERS;
          _addOrganizationUsersPermission.roles = [];
          _addOrganizationUsersPermission.roles.push(organizationAdminRole);

          _addOrganizationUsersPermission.save(function(err, permission) {
            if (err) return cb2(err);
            addOrganizationUsersPermission = permission;
            cb2();
          });
        } else {
          logger.info('permission: ' + PERMISSION_NAMES.ADD_ORGANIZATION_USERS + ' found, skipping...');
          cb2();
        }
      },
      function createProjectAdminPermissions_step(cb2) {
        if (!addProjectUsersPermission) {
          logger.info('creating permission: ' + PERMISSION_NAMES.ADD_PROJECT_USERS);

          var _addProjectUsersPermission = new Permission();
          _addProjectUsersPermission.name = PERMISSION_NAMES.ADD_PROJECT_USERS;
          _addProjectUsersPermission.roles = [];
          _addProjectUsersPermission.roles.push(projectAdminRole);

          _addProjectUsersPermission.save(function(err, permission) {
            if (err) return cb2(err);
            addProjectUsersPermission = permission;
            cb2();
          });
        } else {
          logger.info('permission: ' + PERMISSION_NAMES.ADD_PROJECT_USERS + ' found, skipping...');
          cb2();
        }
      }
    ], cb1);
  });

  async.series(_steps, done);
});

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function runSteps(steps, next) {
  var newSteps = [];

  _.each(steps, function(step) {
    newSteps.push(function(done) {
      var fnName = functionName(step);
      var index = steps.indexOf(step) + 1;

      console.log('\n' + index + ') - ' + fnName + ' ---------------------');

      step(done);
    });
  });

  async.series(newSteps, next);
}

function functionName(fun) {
  var ret = fun.toString();
  ret = ret.substr('function '.length);
  ret = ret.substr(0, ret.indexOf('('));
  return ret;
}

/* =========================================================================
 * Run
 * ========================================================================= */
module.exports = {
  run: function(options, next) {
    app.init({
      http: false
    }, function() {
      dbSeed(options, next);
    });
  }
};
