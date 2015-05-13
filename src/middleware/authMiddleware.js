/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

//modules
var logger = require('modules/logger');
var errors = require('modules/error');
var authService = require('modules/auth');

var authUtil = require('modules/auth/util');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function AuthMiddleware() {}

//authentication middleware =================================================================
AuthMiddleware.prototype.authenticationRequired = function authenticationRequired(req, res, next) {
  var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];

  if (!token) {
    return next(new errors.UnauthorizedError('Access token required'));
  } else {
    authService.authenticateToken({
      token: token
    }, function(err, claims) {
      if (err) return next(err);

      //attach the user's claims to the request
      req.claims = claims;

      return next(null);
    });
  }
};

//authorization middleware =================================================================
//verifies the user id matches the auth token info - param
AuthMiddleware.prototype.currentUserIdQueryParamRequired = function currentUserIdQueryParamRequired(paramName) {
  var param = paramName || 'id';

  return function _currentUserIdQueryParamRequired(req, res, next) {
    if (!req.claims) return next(new errors.ForbiddenError('Access Denied'));
    if (req.claims.admin) return next(); //allow admins to bypass
    if (!req.params[param] || req.params[param] !== req.claims.userId) {
      return next(new errors.ForbiddenError('Current user id does not match user id param'));
    } else {
      return next(null);
    }
  };
};

//verifies the user id matches the auth token info - body
AuthMiddleware.prototype.currentUserIdBodyParamRequired = function currentUserIdBodyParamRequired(paramName) {
  var param = paramName || 'id';

  return function _currentUserIdQueryBodyRequired(req, res, next) {
    if (!req.claims) return next(new errors.ForbiddenError('Access Denied'));
    if (req.claims.admin) return next(); //allow admins to bypass
    if (!req.body[param] || req.body[param] !== req.claims.userId) {
      return next(new errors.ForbiddenError('Current user id does not match user id body param'));
    }
    return next(null);
  };
};

//verifies the user id matches the auth token info - body - only checks if the body param exists
AuthMiddleware.prototype.currentUserIdBodyParamOptional = function currentUserIdBodyParamOptional(paramName) {
  var param = paramName || 'id';

  return function _currentUserIdBodyParamOptional(req, res, next) {
    if (!req.claims) return next(new errors.ForbiddenError('Access Denied'));
    if (req.claims.admin || !req.body[param]) return next(); //allow admins to bypass
    if (!req.body[param] || req.body[param] !== req.claims.userId) {
      return next(new errors.ForbiddenError('Current user id does not match user id body param'));
    }
    return next(null);
  };
};

// ----------------------------------
// Organization
// ----------------------------------

//verifies the user is an organization member - param
AuthMiddleware.prototype.currentUserOrganizationIdQueryParamRequired = function currentUserOrganizationIdQueryParamRequired(paramName) {
  var param = paramName || 'id';

  return function _currentUserOrganizationIdQueryParamRequired(req, res, next) {
    if (!req.claims) return next(new errors.ForbiddenError('Access Denied'));
    if (req.claims.admin) return next(); //allow admins to bypass
    if (!req.claims || !req.params[param] || !req.claims.organizationIds || !req.claims.organizationIds.length || !_.contains(req.claims.organizationIds, req.params[param])) {
      return next(new errors.ForbiddenError('Access Denied'));
    }
    return next(null);
  };
};

//verifies the user is an organization member - body
AuthMiddleware.prototype.currentUserOrganizationIdBodyParamRequired = function currentUserOrganizationIdBodyParamRequired(paramName) {
  var param = paramName || 'id';

  return function _currentUserOrganizationIdBodyParamRequired(req, res, next) {
    if (!req.claims) return next(new errors.ForbiddenError('Access Denied'));
    if (req.claims.admin) return next(); //allow admins to bypass
    if (!req.claims || !req.body[param] || !req.claims.organizationIds || !req.claims.organizationIds.length || !_.contains(req.claims.organizationIds, req.body[param])) {
      return next(new errors.ForbiddenError('Access Denied'));
    }
    return next(null);
  };
};

//verifies the user is an organization member - body - only checks if the body param exists
AuthMiddleware.prototype.currentUserOrganizationIdBodyParamOptional = function currentUserOrganizationIdBodyParamOptional(paramName) {
  var param = paramName || 'id';

  return function _currentUserOrganizationIdBodyParamOptional(req, res, next) {
    if (!req.claims) return next(new errors.ForbiddenError('Access Denied'));
    if (req.claims.admin || !req.body[param]) return next(); //allow admins to bypass, or if the param doesn't exist
    if (!req.claims || !req.claims.organizationIds || !req.claims.organizationIds.length || !_.contains(req.claims.organizationIds, req.body[param])) {
      return next(new errors.ForbiddenError('Access Denied'));
    }
    return next(null);
  };
};

// ----------------------------------
// Projects
// ----------------------------------

//verifies the user is a project member - param
AuthMiddleware.prototype.currentUserProjectIdQueryParamRequired = function currentUserProjectIdQueryParamRequired(paramName) {
  var param = paramName || 'id';

  return function _currentUserProjectIdParamRequired(req, res, next) {
    if (!req.claims) return next(new errors.ForbiddenError('Access Denied'));
    if (req.claims.admin) return next(); //allow admins to bypass
    if (!req.claims || !req.params[param] || !req.claims.projectIds || !req.claims.projectIds.length || !_.contains(req.claims.projectIds, req.params[param])) {
      return next(new errors.ForbiddenError('Access Denied'));
    }
    return next(null);
  };
};

//verifies the user is a project member - param
AuthMiddleware.prototype.currentUserProjectIdBodyParamRequired = function currentUserProjectIdBodyParamRequired(paramName) {
  var param = paramName || 'id';

  return function _currentUserProjectIdBodyParamRequired(req, res, next) {
    if (!req.claims) return next(new errors.ForbiddenError('Access Denied'));
    if (req.claims.admin) return next(); //allow admins to bypass
    if (!req.claims || !req.params[param] || !req.claims.projectIds || !req.claims.projectIds.length || !_.contains(req.claims.projectIds, req.body[param])) {
      return next(new errors.ForbiddenError('Access Denied'));
    }
    return next(null);
  };
};

//verifies the user is a project member - param
AuthMiddleware.prototype.currentUserProjectIdBodyParamOptional = function currentUserProjectIdBodyParamOptional(paramName) {
  var param = paramName || 'id';

  return function _currentUserProjectIdBodyParamOptional(req, res, next) {
    if (!req.claims) return next(new errors.ForbiddenError('Access Denied'));
    if (req.claims.admin || !req.body[param]) return next(); //allow admins to bypass, or if the param doesn't exist
    if (!req.claims || !req.claims.projectIds || !req.claims.projectIds.length || !_.contains(req.claims.projectIds, req.body[param])) {
      return next(new errors.ForbiddenError('Access Denied'));
    }
    return next(null);
  };
};

//verifies the user is a project member with a certain permission - param
AuthMiddleware.prototype.currentProjectPermissionParamRequired = function currentProjectPermissionParamRequired(permissionName, projectIdParamName) {
  projectIdParamName = projectIdParamName || 'id';

  return function _currentProjectPermissionParamRequired(req, res, next) {
    var projectId;

    if (req.claims.admin) return next(); //allow admins to bypass

    if (!req.claims || !req.params) {
      return next(new errors.ForbiddenError('Access Denied'));
    }

    projectId = req.params[projectIdParamName];

    if (!req.claims.projectIds || !req.claims.projectIds.length || !_.contains(req.claims.projectIds, req.params[param]) || !req.claims.projectPermissions[projectId]) {
      return next(new errors.ForbiddenError('Access Denied'));
    }

    var projectPermissions = req.claims.projectPermissions[projectId];

    var foundPermission = _.find(projectPermissions, function(permission) {
      return permission.name === permissionName;
    });

    if (!foundPermission) {
      return next(new errors.ForbiddenError('Access Denied'));
    }

    return next();
  };
};

// ----------------------------------
// Admin
// ----------------------------------

//checks that current user is an system level admin
AuthMiddleware.prototype.adminRequired = function adminRequired(req, res, next) {
  if (!req.claims || !req.claims.admin) {
    return next(new errors.ForbiddenError('Current user is not an admin'));
  } else {
    next();
  }
};

// public api ===============================================================================
module.exports = new AuthMiddleware();
