/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var https = require('https');
var _ = require('underscore');
var querystring = require('querystring');

var appConfig = require('src/config/app-config');

//modules
var errors = require('modules/error');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Consructor
 * ========================================================================= */
function MailgunApi() {}

/**
 * @description Upload a file to the proflie pic bucket
 *
 * @param {object} options
 * @param {string} options.text
 * @param {string} options.html
 * @param {string} options.from
 * @param {string} options.to
 * @param {function} next - callback
 * @returns {string}
 */
MailgunApi.prototype.sendEmail = function sendEmail(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.text && !options.html) return next(new errors.InvalidArgumentError('options.text or options.html is required'));
  if (options.text && !_.isString(options.text)) return next(new errors.InvalidArgumentError('options.text must be a string'));
  if (options.html && !_.isString(options.html)) return next(new errors.InvalidArgumentError('options.html must be a string'));
  if (!options.from || !_.isString(options.from)) return next(new errors.InvalidArgumentError('options.from is required'));
  if (!options.to || (!_.isString(options.to) && !_.isArray(options.to))) return next(new errors.InvalidArgumentError('options.to is required'));
  if (!options.subject || !_.isString(options.subject)) return next(new errors.InvalidArgumentError('options.subject is required'));
  
  var postData = querystring.stringify({
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  });

  var postOptions = {
    hostname: appConfig.mailgun.api,
    path: '/v2/' + appConfig.mailgun.domain + '/messages',
    port: 443,
    method: 'POST',
    auth: 'api:' + appConfig.mailgun.key,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  var request = https.request(postOptions, function(response) {
    var data = '';

    response.on('data', function(chunk) {
      data += chunk;
    });

    response.on('end', function() {
      var responseData;

      try {
        responseData = JSON.parse(data);
      } catch (err) {
        return next(new errors.InternalServiceError('Error parsing mailgun response'));
      }

      return next(null, responseData);
    });
  });

  request.write(postData);

  request.on('error', function(err) {
    return next(err);
  });

  request.end();

  return;
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new MailgunApi();
