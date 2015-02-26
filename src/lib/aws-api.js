/* =========================================================================
 * Dependencies
 * ========================================================================= */
var fs = require('fs');
var AWS = require('aws-sdk');
var async = require('async');
var uuid = require('node-uuid');
var s3 = new AWS.S3();

//modules
var errors = require('modules/error');

/* =========================================================================
 * Constants
 * ========================================================================= */
var BUCKETS = {
  PROFILE_PICS: 'throughcompany-profilepics',
};

/* =========================================================================
 * Consructor
 * ========================================================================= */
function AwsApi() {}

/**
 * @param {object} options
 * @param {string} options.filePath
 * @param {string} options.fileName
 * @param {string} options.fileType
 * @param {function} next - callback
 * @returns {string} url - image url
 */
AwsApi.prototype.uploadProfilePic = function upload(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  options.bucket = BUCKETS.PROFILE_PICS;

  uploadImage(options, next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function uploadImage(options, next) {
  if (!options) return next(new errors.InternalServiceError('options is required'));
  if (!options.bucket) return next(new errors.InternalServiceError('options.bucket is required'));
  if (!options.filePath) return next(new errors.InternalServiceError('options.filePath is required'));
  if (!options.fileName) return next(new errors.InternalServiceError('options.fileName is required'));
  if (!options.fileType) return next(new errors.InternalServiceError('options.fileType is required'));

  fs.readFile(options.filePath, function(err, fileData) {
    if (err) return next(err);

    var name = uuid.v4() + '-' + uuid.v4() + '-' + options.fileName;

    var url = 'https://s3.amazonaws.com' + '/' + options.bucket + '/' + name;

    s3.putObject({
      ACL: 'public-read',
      Bucket: options.bucket,
      Key: name,
      ContentType: options.fileType,
      CacheControl: 'public, max-age=31536000',
      Body: fileData
    }, function(err) {
      if (err) return next(err);

      fs.unlink(options.filePath, function(err) {
        if (err) return next(err);

        next(null, url);
      });
    });
  });
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new AwsApi();
