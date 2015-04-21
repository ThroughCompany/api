/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');

//modules
var errors = require('modules/error');

/* =========================================================================
 * Constants
 * ========================================================================= */
var REGEXES = require('modules/common/constants/regexes');
var FIELD_LENGTHS = require('../constants/fieldLengths');
var LINK_TYPES = require('modules/common/constants/linkTypes');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function Validator() {}

Validator.prototype.validateCreate = function(data, next) {
  if (!data.name) return next(new errors.InvalidArgumentError('Name is required'));
  if (!data.createdByUserId) return next(new errors.InvalidArgumentError('Created By User Id is required'));

  baseValidate(null, data, next);
};

Validator.prototype.validateUpdate = function(project, data, next) {
  baseValidate(project, data, next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function baseValidate(project, data, next) {
  if (data.description && data.description.length > FIELD_LENGTHS.DESCRIPTION) return next(new errors.InvalidArgumentError('description cannot be longer than ' + FIELD_LENGTHS.DESCRIPTION));

  var steps = [];

  if (data.socialLinks) {
    steps.push(function validateSocialLinks_step(done) {
      validateSocialLinks(data.socialLinks, done);
    });
  }

  async.series(steps, function(err) {
    next(err);
  });
}

function validateSocialLinks(socialLinks, next) {
  if (!_.isArray(socialLinks)) return next(new errors.InvalidArgumentError('Social Links must be an array'));

  for (var i = 0; i < socialLinks.length; i++) {
    var socialLink = socialLinks[i];

    if (!socialLink.type || !_.isString(socialLink.type)) {
      return next(new errors.InvalidArgumentError('Social Links must have a type'));
      break;
    }
    if (!socialLink.name || !_.isString(socialLink.name)) {
      return next(new errors.InvalidArgumentError('Social Links must have a name'));
      break;
    }
    if (!socialLink.link || !_.isString(socialLink.link)) {
      return next(new errors.InvalidArgumentError('Social Links must have a link'));
      break;
    }
    if (!_.contains(_.values(LINK_TYPES), socialLink.type.toUpperCase())) {
      return next(new errors.InvalidArgumentError(socialLink.type + ' is not a valid link type'));
      break;
    }
    if (!REGEXES.url.test(socialLink.link)) {
      return next(new errors.InvalidArgumentError('Social Links must be valid links'));
      break;
    }

    //TODO:check for duplicate links
  }

  next();
}

/* =========================================================================
 * Export
 * ========================================================================= */

module.exports = new Validator();
