/* =========================================================================
 * Dependencies
 * ========================================================================= */
var fs = require('fs');
var async = require('async');
var uuid = require('node-uuid');
var http = require('http');

var appConfig = require('src/config/app-config');

//modules
var errors = require('modules/error');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Consructor
 * ========================================================================= */
function BlitlineApi() {}

/**
 * @description Upload a file to the proflie pic bucket
 *
 * @param {object} options
 * @param {string} options.filePath
 * @param {string} options.fileName
 * @param {string} options.fileType
 * @param {function} next - callback
 * @returns {string} url - image url
 */
BlitlineApi.prototype.uploadImage = function upload(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.imageUrl) return next(new errors.InvalidArgumentError('options.imageUrl is required'));

  var postData = {
    application_id: appConfig.blitline.key,
    host: appConfig.blitline.api,
    path: options.imageUrl,
    method: 'POST',
    v: appConfig.blitline.version,
    functions: []
  };

  var request = http.request(options, function(response) {
    var data = '';

    response.on('data', function(chunk) {
      data += chunk;
    });

    response.on('end', function() {
      return next(null, data);
    });
  });

  request.on('error', function(err) {
    return next(err);
  });

  request.write(postData);

  request.end();
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new BlitlineApi();
