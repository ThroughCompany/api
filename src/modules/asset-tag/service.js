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
      var query = AssetTag.find({
        slug: slug
      });

      query.select('slug');

      query.exec(function(err, assetTag) {
        if (err) return done(err);
        if (assetTag) return done(null, assetTag);

        done();
      });
    },
    function createAssetTag_step(done) {
      var assetTag = new AssetTag();
      assetTag.name = options.name;
      assetTag.slug = slug;

      assetTag.save(done);
    }
  ], next);
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
      _.this.getByName({
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
      _.this.getByName({
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

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new AssetTagService();
