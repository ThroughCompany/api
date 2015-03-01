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
 * @description Upload a file to the proflie pic bucket
 *
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

  async.waterfall([
    function readFileFromDisk_step(done) {
      fs.readFile(options.filePath, done);
    },
    function uploadFileToAws_step(fileData, done) {
      var name = uuid.v4() + '-' + uuid.v4() + '-' + options.fileName;

      s3.putObject({
        ACL: 'public-read',
        Bucket: options.bucket,
        Key: name,
        ContentType: options.fileType,
        CacheControl: 'public, max-age=31536000',
        Body: fileData
      }, done);
    },
    function cleanupFileFromDisk_step(result, done) {
      fs.unlink(options.filePath, function(err) {
        if (err) return next(err);

        var url = 'https://s3.amazonaws.com' + '/' + options.bucket + '/' + name;

        //return just the url to the image on AWS
        done(null, url);
      });
    }
  ], next);
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new AwsApi();
