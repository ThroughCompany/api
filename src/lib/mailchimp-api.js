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
var MassChallengeSubscribeListId = '407d0fa0f4';
var ProjectNeedSubscribeListId = 'e046829080';

var validLists = {
  'massChallenge': MassChallengeSubscribeListId,
  'prejectNeed': ProjectNeedSubscribeListId
};

/* =========================================================================
 * Consructor
 * ========================================================================= */
function MailChimpApi() {}

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
MailChimpApi.prototype.subscribe = function subscribe(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.email) return next(new errors.InvalidArgumentError('options.email is required'));
  if (!options.list) return next(new errors.InvalidArgumentError('options.list is required'));
  if (!validLists[options.list]) return next(new errors.InvalidArgumentError('invalid list'));

  var postData = JSON.stringify({
    apikey: appConfig.mailchimp.key,
    id: validLists[options.list],
    email_address: options.email
  });

  var postOptions = {
    hostname: appConfig.mailchimp.api,
    path: '/1.3/?method=listSubscribe',
    port: 443,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  var request = https.request(postOptions, function(response) {
    if (response.statusCode >= 500) return next(new Error(response));

    var data = '';

    response.on('data', function(chunk) {
      data += chunk;
    });

    response.on('end', function() {
      return next(null, {
        status: 'Success'
      });
    });
  });

  request.write(postData);

  request.on('error', function(err) {
    return next(err);
  });

  request.end();

  return
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new MailChimpApi();
