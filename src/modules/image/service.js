/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');
var uuid = require('node-uuid');
var px = require('6px');

var appConfig = require('src/config/app-config');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');

//lib
var awsApi = require('lib/aws-api');

/* =========================================================================
 * Constants
 * ========================================================================= */
var IMAGE_TYPES = require('./constants/image-types');

var ALLOWED_FILE_TYPES = {
  JPG: 'IMAGE/JPEG',
  PNG: 'IMAGE/PNG'
};

/* =========================================================================
 * Constructor
 * ========================================================================= */
function ImageService() {}

/**
 * @description Upload a file
 *
 * @param {object} options
 * @param {function} next - callback
 * @returns {string} url - image url
 */
ImageService.prototype.upload = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.imageType) return next(new errors.InvalidArgumentError('Image Type is required'));
  if (!options.filePath) return next(new errors.InvalidArgumentError('FilePath is required'));
  if (!options.fileName) return next(new errors.InvalidArgumentError('FileName is required'));
  if (!options.fileType) return next(new errors.InvalidArgumentError('FileType is required'));
  if (!_.isString(options.fileType)) return next(new errors.InvalidArgumentError('FileType must be a string'));
  options.fileType = options.fileType.toUpperCase();

  if (!_.contains(_.values(IMAGE_TYPES), options.imageType)) return next(new errors.InvalidArgumentError(options.imageType + ' is not a valid image type'));
  if (!_.contains(_.values(ALLOWED_FILE_TYPES), options.fileType)) return next(new errors.InvalidArgumentError(options.fileType + ' is not a valid file type'));

  var _this = this;

  switch (options.imageType) {
    case IMAGE_TYPES.PROFILE_PIC:
      awsApi.uploadProfilePic({
        filePath: options.filePath,
        fileName: options.fileName,
        fileType: options.fileType
      }, next);
      break;
  }
};

// public api ===============================================================================
module.exports = new ImageService();
