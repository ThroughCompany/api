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
var LINK_TYPES = require('modules/common/constants/linkTypes');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function Validator() {}

Validator.prototype.validateCreate = function(data, next) {
  if (!data.email) return next(new errors.InvalidArgumentError('Email is required'));
  if (!data.password) return next(new errors.InvalidArgumentError('Password is required'));

  baseValidate(null, data, next);
};

Validator.prototype.validateUpdate = function(user, data, next) {
  baseValidate(user, data, next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function baseValidate(user, data, next) {
  if (data.email && !REGEXES.email.test(data.email)) return next(new errors.InvalidArgumentError(data.email + ' is not a valid email address'));
  if (data.password && data.password.length < 6) return next(new errors.InvalidArgumentError('Password must be at least 6 characters'));

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

    if (!socialLink.type || !_.isString(socialLink.type)) return next(new errors.InvalidArgumentError('Social Links must have a type'));
    if (!socialLink.name || !_.isString(socialLink.name)) return next(new errors.InvalidArgumentError('Social Links must have a name'));
    if (!socialLink.link || !_.isString(socialLink.link)) return next(new errors.InvalidArgumentError('Social Links must have a link'));
    if (!_.contains(_.values(LINK_TYPES), socialLink.type.toUpperCase())) return next(new errors.InvalidArgumentError(socialLink.type + ' is not a valid link type'));
    if (!REGEXES.url.test(socialLink.link)) return next(new errors.InvalidArgumentError('Social Links must be valid links'));

    //TODO:check for duplicate links
  }

  next();
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new Validator();
