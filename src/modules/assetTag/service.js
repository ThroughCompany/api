/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');

//models
var AssetTag = require('./data/model');

/* =========================================================================
 * Constants
 * ========================================================================= */
var TAKE = 50;
var MAX_TAKE = 200;

/* =========================================================================
 * Constructor
 * ========================================================================= */
var AssetTagService = function() {
  CommonService.call(this, AssetTag);
};
util.inherits(AssetTagService, CommonService);

/**
 * @param {object} options
 * @param {string} name
 * @param {function} next - callback
 */
AssetTagService.prototype.getByName = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));

  var query = AssetTag.findOne({
    name: options.name
  });

  query.exec(function(err, assetTag) {
    if (err) return next(err);
    if (!assetTag) return next(new errors.ObjectNotFoundError('Asset Tag not found'));

    next(null, assetTag);
  });
};

/**
 * @param {object} options
 * @param {object} [options.name]
 * @param {object} [options.select]
 * @param {object} [options.take]
 * @param {function} next - callback
 */
AssetTagService.prototype.getAll = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  var conditions = {};

  console.log(options.select);

  if (options.name) {
    var nameRegex = new RegExp(options.name, 'ig');

    conditions.name = {
      $regex: nameRegex
    };
  }

  var query = AssetTag.find(conditions);

  if (options.select) {
    query.select(options.select);
  }

  query.limit(options.take && options.take <= MAX_TAKE ? options.take : TAKE);

  query.sort('projectUseCount');

  query.exec(function(err, assetTags) {
    if (err) return next(err);

    next(null, assetTags);
  });
};

/**
 * @param {object} options
 * @param {string} options.name
 * @param {function} next - callback
 */
AssetTagService.prototype.getOrCreateByName = function getOrCreateByName(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));

  var _this = this;

  var slug = generateSlug(options.name);

  async.waterfall([
    function verifyTagIsUnique_step(done) {
      var query = AssetTag.findOne({
        slug: slug
      });

      query.exec(function(err, assetTag) {
        if (err) return done(err);

        done(null, assetTag);
      });
    },
    function createAssetTag_step(assetTag, done) {
      if (assetTag) return done(null, assetTag);

      var assetTag = new AssetTag();
      assetTag.name = options.name;
      assetTag.slug = slug;

      assetTag.save(done);
    }
  ], function(err, assetTag) {
    next(err, assetTag);
  });
};

/**
 * @param {object} options
 * @param {string} options.name
 * @param {function} next - callback
 */
AssetTagService.prototype.updateTagUserUseCount = function updateTagUserUseCount(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));

  var _this = this;

  var slug = generateSlug(options.name);

  async.waterfall([
    function findTagByName_step(done) {
      _this.getByName({
        name: options.name
      }, done);
    },
    function updateAssetTag_step(assetTag, done) {
      assetTag.userUseCount = assetTag.userUseCount + 1;
      assetTag.save(done);
    }
  ], next);
};

/**
 * @param {object} options
 * @param {string} options.name
 * @param {function} next - callback
 */
AssetTagService.prototype.updateTagProjectUseCount = function updateTagProjectUseCount(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));

  var _this = this;

  var slug = generateSlug(options.name);

  async.waterfall([
    function findTagByName_step(done) {
      _this.getByName({
        name: options.name
      }, done);
    },
    function updateAssetTag_step(assetTag, done) {
      assetTag.projectUseCount = assetTag.projectUseCount + 1;
      assetTag.save(done);
    }
  ], next);
};
/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function generateSlug(name) {
  return name.trim().replace(/\s/gi, '-').replace(/('|\.)/gi, '').toLowerCase();
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new AssetTagService();
