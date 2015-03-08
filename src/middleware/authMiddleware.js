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

      //attach the user and their claims to the request
      req.claims = claims;

      return next();
    });
  }
};

//authorization middleware =================================================================
//checks for id as URL param against current user id claim
AuthMiddleware.prototype.currentUserIdParamRequired = function currentUserIdParamRequired(paramName) {
  var param = paramName || 'id';

  return function _currentUserIdParamRequired(req, res, next) {
    if (!req.claims || !req.params[param] || (req.params[param] !== req.claims.userId && !req.claims.admin)) { //allow admins to bypass
      return next(new errors.ForbiddenError('Current user id does not match user id param'));
    } else {
      next();
    }
  };
};

//checks for id as URL param against current project id claims
AuthMiddleware.prototype.currentUserProjectIdParamRequired = function currentUserProjectIdParamRequired(paramName) {
  var param = paramName || 'id';

  return function _currentUserProjectIdParamRequired(req, res, next) {
    if (!req.claims || !req.params[param] || !req.claims.projectIds || !req.claims.projectIds.length || (!_.contains(req.claims.projectIds, req.params[param]) && !req.claims.admin)) { //allow admins to bypass
      return next(new errors.ForbiddenError('Current user is not a project member'));
    } else {
      next();
    }
  };
};

//checks that current user is an system level admin
AuthMiddleware.prototype.adminRequired = function adminRequired(req, res, next) {
  if (!req.claims || !req.claims.admin) {
    return next(new errors.ForbiddenError('Current user is not an admin'));
  } else {
    next();
  }
};

// //checks for id as URL param against current company ids claim
// AuthMiddleware.prototype.currentCompanyIdParamRequired = function(paramName) {
//   var param = paramName || 'id';

//   return function currentCompanyIdParamRequired(req, res, next) {
//     if (!req.user || !req.claims || !req.params[param] || !_.contains(req.claims.companyIds, req.params[param])) {
//       return next(new errors.ForbiddenError());
//     } else {
//       next();
//     }
//   };
// };

// //checks for company admin claim using company id as URL param 
// AuthMiddleware.prototype.currentCompanyClaimRequiredBody = function(claim, companyIdBodyPropertyName) {
//   companyIdBodyPropertyName = companyIdBodyPropertyName || 'id';

//   return function currentCompanyClaimRequiredBody(req, res, next) {
//     if (!req.user || !req.claims || !req.params || !req.params[companyIdBodyPropertyName] || !req.claims[claim + '-' + req.params[companyIdBodyPropertyName]]) {
//       return next(new errors.ForbiddenError('User does not have the claim ' + claim));
//     } else {
//       next();
//     }
//   };
// };

// public api ===============================================================================
module.exports = new AuthMiddleware();
