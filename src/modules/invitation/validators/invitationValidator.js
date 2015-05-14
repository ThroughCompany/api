/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');

var errors = require('modules/error');

/* =========================================================================
 * Constants
 * ========================================================================= */
var INVITATION_STATUSES = require('modules/invitation/constants/invitationStatuses');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function Validator() {}

Validator.prototype.validateCreate = function(data, next) {
  baseValidate(null, data, next);
};

Validator.prototype.validateUpdate = function(invitation, data, next) {
  baseValidate(invitation, data, next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function baseValidate(invitation, data, next) {
  var steps = [];

  if (data.status) {
    if (!_.contains(_.values(INVITATION_STATUSES), data.status)) return next(new errors.InvalidArgumentError(data.status + ' is not a valid invitation status'));
    if (invitation) {
      if (invitation.status === INVITATION_STATUSES.ACCEPTED || invitation.status === INVITATION_STATUSES.DECLINED) return next(new errors.InvalidArgumentError(INVITATION_STATUSES.ACCEPTED + ' or ' + INVITATION_STATUSES.DECLINED + ' invitation status cannot be updated'));
    }
  }

  async.series(steps, function(err) {
    return next(err);
  });
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new Validator();
