/* =========================================================================
 * Dependencies
 * ========================================================================= */
var fb = require('fb');

//modules
var errors = require('modules/error');

/* =========================================================================
 * Consructor
 * ========================================================================= */
function FacebookApi() {}

FacebookApi.prototype.getUserByToken = function getCurrentUser(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.facebookAccessToken) return next(new errors.InvalidArgumentError('Facebook Access Token is required'));

  fb.setAccessToken(options.facebookAccessToken);
  fb.napi('me', next);
};

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new FacebookApi();
