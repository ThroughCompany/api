/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var fs = require('fs');

//services
var authService = require('modules/auth');
var organizationService = require('modules/organization');
var applicationService = require('modules/application');

/* =========================================================================
 * Constants
 * ========================================================================= */
var IMAGE_TYPE_SIZES = require('modules/image/constants/image-type-sizes');

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

/** 
 * @description Get a project by id
 */
Controller.prototype.getOrganizationById = function getOrganizationById(req, res, next) {
  var organizationId = req.params.id;
  var fields = req.query.fields;

  async.waterfall([
    function getOrganizationById_step(done) {
      organizationService.getById({
        organizationId: organizationId,
        fields: fields
      }, done);
    }
  ], function(err, organization) {
    if (err) return next(err);
    return res.status(200).json(organization);
  });
};

/** 
 * @description Create a project
 */
Controller.prototype.createOrganization = function createOrganization(req, res, next) {
  var data = req.body;
  data.createdByUserId = req.claims.userId;

  organizationService.create(data, function(err, newOrganization) {
    if (err) return next(err);
    return res.status(201).json(newOrganization);
  });
};

/** 
 * @description Get project applications
 */
Controller.prototype.getOrganizationApplications = function(req, res, next) {
  var organizationId = req.params.id;

  applicationService.getOrganizationApplications({
    organizationId: organizationId
  }, function(err, applications) {
    if (err) return next(err);
    return res.status(200).json(applications);
  });
};

/** 
 * @description Upload a user image
 */
Controller.prototype.uploadImage = function(req, res, next) {
  var organizationId = req.params.id;
  var imageType = req.query.imageType;
  var files = req.files;

  if (!files || !files.image) {
    return cleanup(files, function(err) {
      if (err) return next(err);
      return next(new errors.InvalidArgumentError('Image is required'));
    });
  }

  var image = files.image;

  if (image.size > IMAGE_TYPE_SIZES.PROFILE_PIC) return next(new errors.InvalidArgumentError('file size cannot exceed ' + IMAGE_TYPE_SIZES.PROFILE_PIC + ' bytes'));

  organizationService.uploadImage({
    organizationId: organizationId,
    imageType: imageType,
    fileName: image.name,
    filePath: image.path,
    fileType: image.type
  }, function(err, organization) {
    if (err) return next(err);
    return res.status(200).json(organization);
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
/** 
 * @description Delete a set of files
 *
 * @param {array} filePaths - array of file paths
 * @param {function} next - callback
 */
function cleanup(filePaths, next) {
  if (!filePaths || !filePaths.length) return next();

  async.each(filePaths, function(filePath, done) {
    fs.unlink(filePath, done);
  }, next);
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
