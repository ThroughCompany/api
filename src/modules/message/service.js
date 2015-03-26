/* =========================================================================
 * Dependencies
 * ========================================================================= */
var appConfig = require('src/config/app-config');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');

//lib
var mailGunApi = require('lib/mailgun-api');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function MessageService() {}

MessageService.prototype.sendEmail = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.text || !_.isString(options.text)) return next(new errors.InvalidArgumentError('options.text is required'));
  if (!options.from || !_.isString(options.from)) return next(new errors.InvalidArgumentError('options.from is required'));
  if (!options.to || (!_.isString(options.to) && !_.isArray(options.to))) return next(new errors.InvalidArgumentError('options.to is required'));

  to = _.isArray(options.to) ? _.filter(options.to, function(toEmail) {
    return toEmail != undefined && toEmail != null && toEmail != '';
  }) : options.to;

  
};

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new MessageService();
