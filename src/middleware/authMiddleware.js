"use strict";

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');
var authService = require('../services/authService');
var authUtil = require('../utils/authUtil');
var errors = require('../errors/errors');

var authMiddleware = {};

//authentication middleware =================================================================
authMiddleware.authenticationRequired = function(req, res, next) {

  var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];

  CompanyFloor.logger.info('URL = ' + req.url);

  for (var key in req.body) {
    console.log('KEY = ' + key + ' = ' + req.body[key]);
  }

  if (!token) {
    return next(new errors.ForbiddenError('Access token required'));
  } else {
    authService.authenticateToken(token, function(err, user, claims) {
      if (err) return next(err);

      //attach the user and their claims to the request
      req.user = user;
      req.claims = claims;

      return next();
    });
  }
};

//authoriazation middleware =================================================================
//checks for id as URL param against current user id claim
authMiddleware.currentUserIdParamRequired = function(paramName) {
  var param = paramName || 'id';

  return function currentUserIdParamRequired(req, res, next) {
    if (!req.user || !req.claims || !req.params[param] || req.params[param] !== req.claims.userId) {
      return next(new errors.ForbiddenError());
    } else {
      next();
    }
  };
};

//checks for id as URL param against current company ids claim
authMiddleware.currentCompanyIdParamRequired = function(paramName) {
  var param = paramName || 'id';

  return function currentCompanyIdParamRequired(req, res, next) {
    if (!req.user || !req.claims || !req.params[param] || !_.contains(req.claims.companyIds, req.params[param])) {
      return next(new errors.ForbiddenError());
    } else {
      next();
    }
  };
};

//checks for company admin claim using company id as URL param 
authMiddleware.currentCompanyClaimRequiredBody = function(claim, companyIdBodyPropertyName) {
  companyIdBodyPropertyName = companyIdBodyPropertyName || 'id';

  return function currentCompanyClaimRequiredBody(req, res, next) {
    if (!req.user || !req.claims || !req.params || !req.params[companyIdBodyPropertyName] || !req.claims[claim + '-' + req.params[companyIdBodyPropertyName]]) {
      return next(new errors.ForbiddenError('User does not have the claim ' + claim));
    } else {
      next();
    }
  };
};

// public api ===============================================================================
module.exports = authMiddleware;
