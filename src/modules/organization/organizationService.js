/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');
var jsonPatch = require('fast-json-patch');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');
var permissionService = require('modules/permission');
var userService = require('modules/user');
var imageService = require('modules/image');
var organizationPopulateService = require('./populate/service');
var organizationProjectService = require('./projectService');
var organizationUserService = require('./userService');

//models
var Organization = require('modules/organization/data/organizationModel');
var OrganizationUser = require('modules/organization/data/userModel');

//utils
var patchUtils = require('utils/patchUtils');
var streamUtils = require('utils/streamUtils');
var utils = require('utils/utils');

var organizationValidator = require('./validators/organizationValidator');

var partialResponseParser = require('modules/partialResponse/parser');

/* =========================================================================
 * Constants
 * ========================================================================= */
//var EVENTS = require('./constants/events');
var ROLES = require('modules/role/constants/roleNames');
var DEFAULTIMAGEURL = 'https://s3.amazonaws.com/throughcompany-assets/images/orgprofilepic_default.png';
var IMAGE_TYPES = require('modules/image/constants/image-types');

var UPDATEDABLE_ORGANIZATION_PROPERTIES = [
  'name',
  'description',
  'location',
  'socialLinks'
];

/* =========================================================================
 * Constructor
 * ========================================================================= */
var OrganizationService = function() {
  CommonService.call(this, Organization);
};
util.inherits(OrganizationService, CommonService);

/**
 * @param {object} options
 * @param {string} createdByUserId
 * @param {string} name
 * @param {function} next - callback
 */
OrganizationService.prototype.create = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  var _this = this;
  var user = null;
  var organization = null;
  var organizationUser = null;
  var permissions = null;

  async.waterfall([
    function validateData_step(done) {
      organizationValidator.validateCreate(options, done);
    },
    function findUserByUserId_step(done) {
      userService.getById({
        userId: options.createdByUserId
      }, done);
    },
    function generateOrganizationSlug_step(_user, done) {
      user = _user;

      generateOrganizationSlug(options.name, done);
    },
    function createOrganization_step(slug, done) {
      var organization = new Organization();
      organization.name = options.name;
      organization.created = new Date();
      organization.modified = organization.created;
      organization.slug = slug
      organization.description = options.description;
      organization.profilePic = DEFAULTIMAGEURL;

      organization.save(done);
    },
    function createOrganizationUser_step(_organization, numCreated, done) {
      organization = _organization;

      organizationUserService.create({
        organization: organization,
        user: user,
        role: ROLES.ORGANIZATION_ADMIN
      }, function(err, organizationUser) {
        if (err) return done(err);

        return done(null);
      });
    }
  ], function(err) {
    if (err) return next(err);

    next(null, organization);
  });
};

/**
 * @param {object} options
 * @param {string} options.organizationId
 * @param {string} options.fields
 * @param {function} next - callback
 */
OrganizationService.prototype.getById = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.organizationId) return next(new errors.InvalidArgumentError('Organization Id is required'));

  var _this = this;
  var fields = null;
  var expands = null;

  async.waterfall([
    function parseFieldsAndExpands(done) {
      if (options.fields) {
        partialResponseParser.parse({
          fields: options.fields
        }, function(err, results) {
          if (err) return done(err);

          fields = results.fields;
          expands = results.expands;

          return done();
        });
      } else {
        return done(null);
      }
    },
    function getOrganizationById_step(done) {
      var query = Organization.findOne({
        $or: [{
          _id: options.organizationId
        }, {
          slug: options.organizationId
        }]
      });

      if (fields) {
        query.select(fields.select);
      }

      query.exec(function(err, organization) {
        if (err) return done(err);
        if (!organization) return done(new errors.ObjectNotFoundError('Organization not found'));

        return done(null, organization);
      });
    },
    function populate_step(organization, done) {
      if (!expands) return done(null, organization);

      organizationPopulateService.populate({
        docs: organization,
        expands: expands
      }, done);
    }
  ], next);
};

/**
 * @param {object} options
 * @param {string} options.userId
 * @param {function} next - callback
 */
OrganizationService.prototype.getByUserId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;
  var dataStream = null;

  if (options.stream === true) dataStream = new streamUtils.TransformStream();

  async.waterfall([
    function findOrganizationUsersByUserId_step(done) {
      var query = OrganizationUser.find({
        user: options.userId
      });

      query.exec(done);
    },
    function findOrganizationById_step(organizationUsers, done) {
      var organizationIds = _.pluck(organizationUsers, 'organization');

      var query = Organization.find({
        _id: {
          $in: organizationIds
        }
      });

      if (options.stream === true) {
        query.stream().pipe(dataStream);
      } else {
        query.exec(done);
      }
    }
  ], next);

  return dataStream;
};

/* =========================================================================
 * Organization Projects
 * ========================================================================= */
OrganizationService.prototype.addProject = function(options, next) {
  organizationProjectService.create(options, next);
};

/* =========================================================================
 * Organization Users
 * ========================================================================= */

/**
 * @param {object} options
 * @param {object} options.userId
 * @param {function} next - callback
 */
OrganizationService.prototype.getOrganizationUsersByUserId = function getOrganizationUsersByUserId(options, next) {
  organizationUserService.getByUserId(options, next);
};

/* =========================================================================
 * Images
 * ========================================================================= */
OrganizationService.prototype.uploadImage = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.organizationId) return next(new errors.InvalidArgumentError('Organization Id is required'));
  if (!options.fileName) return next(new errors.InvalidArgumentError('File Name is required'));
  if (!options.filePath) return next(new errors.InvalidArgumentError('File Path is required'));
  if (!options.fileType) return next(new errors.InvalidArgumentError('File Type is required'));
  if (!options.imageType) return next(new errors.InvalidArgumentError('Image Type is required'));

  var validOrganizationImageTypes = [IMAGE_TYPES.PROFILE_PIC_ORGANIZATION];

  if (!_.contains(validOrganizationImageTypes, options.imageType)) return next(new errors.InvalidArgumentError(options.imageType + ' is not a valid image type'));

  var _this = this;
  var organization = null;

  async.waterfall([
    function getOrganizationById_step(done) {
      _this.getById({
        organizationId: options.organizationId
      }, done);
    },
    function uploadImage_step(_organization, done) {
      organization = _organization;

      imageService.upload({
        imageType: options.imageType,
        fileName: options.fileName,
        filePath: options.filePath,
        fileType: options.fileType
      }, done);
    },
    function addImageToOrganization_step(imageUrl, done) {
      var err = null;

      console.log('GOT HERE');

      console.log(organization);

      switch (options.imageType) {
        case IMAGE_TYPES.PROFILE_PIC_ORGANIZATION:
          organization.profilePic = imageUrl;
          break;
        default:
          err = new errors.InvalidArgumentError('Invalid image type');
          break;
      }

      if (err) {
        return done(err);
      } else {
        organization.save(done);
      }
    }
  ], next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function generateOrganizationSlug(organizationName, next) {
  var slug = organizationName.trim().replace(/\s/gi, '-').replace(/('|\.)/gi, '').toLowerCase();

  findUniqueOrganizationSlug(slug, 0, next);
}

function findUniqueOrganizationSlug(slug, attempts, next) {
  var newSlug = attempts > 0 ? slug + attempts : slug;

  findOrganizationBySlug(newSlug, function(err, venues) {
    if (!venues || !venues.length) return next(null, newSlug); //slug is unique
    else { //not unique, bump attempt count, try again
      attempts = attempts + 1;
      findUniqueOrganizationSlug(slug, attempts, next);
    }
  });
}

function findOrganizationBySlug(slug, next) {
  var query = Organization.find({
    slug: slug
  });

  query.select('slug');

  query.exec(next);
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new OrganizationService();
