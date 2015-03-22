/* =========================================================================
 * Dependencies
 * ========================================================================= */
var fs = require('fs');
var AWS = require('aws-sdk');
var async = require('async');
var uuid = require('node-uuid');

var appConfig = require('src/config/app-config');

//modules
var errors = require('modules/error');

AWS.config.update({
  accessKeyId: appConfig.aws.accessKeyId,
  secretAccessKey: appConfig.aws.secretAccessKey
});

/* =========================================================================
 * Constants
 * ========================================================================= */
var BUCKETS = {
  USER_PROFILE_PICS: 'throughcompany-images/users/profile-pictures',
  PROJECT_PROFILE_PICS: 'throughcompany-images/projects/profile-pictures',
  PROJECT_BANNER_PICS: 'throughcompany-images/projects/banner-pictures',
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
AwsApi.prototype.uploadUserProfilePic = function upload(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  options.bucket = BUCKETS.USER_PROFILE_PICS;

  uploadFile(options, next);
};

AwsApi.prototype.uploadProjectProfilePic = function upload(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  options.bucket = BUCKETS.PROJECT_PROFILE_PICS;

  uploadFile(options, next);
};

AwsApi.prototype.uploadProjectBannerPic = function upload(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  options.bucket = BUCKETS.PROJECT_BANNER_PICS;

  uploadFile(options, next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function uploadFile(options, next) {
  if (!options) return next(new errors.InternalServiceError('options is required'));
  if (!options.bucket) return next(new errors.InternalServiceError('options.bucket is required'));
  if (!options.filePath) return next(new errors.InternalServiceError('options.filePath is required'));
  if (!options.fileName) return next(new errors.InternalServiceError('options.fileName is required'));
  if (!options.fileType) return next(new errors.InternalServiceError('options.fileType is required'));

  var path = uuid.v4() + '-' + uuid.v4() + '-' + options.fileName;

  var s3 = new AWS.S3();

  async.waterfall([
    function readFileFromDisk_step(done) {
      fs.readFile(options.filePath, done);
    },
    function uploadFileToAws_step(fileData, done) {
      s3.putObject({
        ACL: 'public-read',
        Bucket: options.bucket,
        Key: path,
        ContentType: options.fileType,
        CacheControl: 'public, max-age=31536000',
        Body: fileData
      }, done);
    },
    function cleanupFileFromDisk_step(result, done) {
      fs.unlink(options.filePath, function(err) {
        if (err) return next(err);

        var url = 'https://s3.amazonaws.com' + '/' + options.bucket + '/' + path;

        //return just the url to the file on AWS
        done(null, url);
      });
    }
  ], next);
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new AwsApi();
