'use strict';

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
const roleRepository = require('./data/roleRepository');
var errors = require('modules/error');
var CommonService = require('modules/common');

//models
var Role = require('./data/model');

/* =========================================================================
 * Constructor
 * ========================================================================= */

class RoleService extends CommonService {
  constructor() {
    super(roleRepository);
  }
};

/**
 * @param {object} options
 * @param {function} next - callback
 */
RoleService.prototype.getByName = function getByName(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.roleName) return next(new errors.InvalidArgumentError('Role Name is required'));

  var query = Role.findOne({
    name: options.roleName
  });

  query.exec(function(err, role) {
    if (err) return next(err);
    if (!role) return next(new errors.ObjectNotFoundError('Role \'' + options.roleName + '\' not found'));

    next(null, role);
  });
};

// public api ===============================================================================
module.exports = new RoleService();
