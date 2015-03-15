/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');
var imageService = require('modules/image');
var assetTagService = require('modules/assetTag');

//models
var User = require('./data/model');
var Auth = require('modules/auth/data/model');

var authUtil = require('modules/auth/util');

var validator = require('./validator');

/* =========================================================================
 * Constants
 * ========================================================================= */
var TAKE = 50;
var MAX_TAKE = 200;

var EVENTS = require('./constants/events');
var REGEXES = require('modules/common/constants/regexes');
var DEFAULTIMAGEURL = 'https://s3.amazonaws.com/throughcompany-assets/user-avatars/avatar';
var IMAGE_TYPES = require('modules/image/constants/image-types');

/* =========================================================================
 * Constructor
 * ========================================================================= */
var UserService = function() {
  CommonService.call(this, User);
};
util.inherits(UserService, CommonService);

/**
 * @param {object} options
 * @param {string} email - user's email address
 * @param {string} password
 * @param {function} next - callback
 */
UserService.prototype.createUsingCredentials = function createUsingCredentials(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  var _this = this;

  async.waterfall([
    function validateData_step(done) {
      validator.validateCreate(options, done);
    },
    function getUserByEmail(done) {
      options.email = options.email.toLowerCase();

      _this.getByEmail({
        email: options.email
      }, done);
    },
    function generatePasswordHash(foundUser, done) {
      if (foundUser) return done(new errors.InvalidArgumentError('A user with the email ' + options.email + ' already exists'));

      authUtil.generatePasswordHashAndSalt(options.password, done);
    },
    function createNewUser(hash, done) {
      var user = new User();
      user.email = options.email;
      user.active = true;
      user.profilePic = DEFAULTIMAGEURL + randomNum(1, 4) + '.jpg';

      user.save(function(err, newUser) {
        done(err, newUser, hash);
      });
    },
    function createNewAuth(user, hash, done) {
      var auth = new Auth();
      auth.user = user._id;
      auth.hash = hash;
      auth.save(function(err, newAuth) {
        done(err, user);
      });
    }
  ], function finish(err, newUser) {
    return next(err, newUser);
  });
};

/**
 * @param {object} options
 * @param {string} email - user's email address
 * @param {string} facebookid - user's facebook id
 * @param {string} facebookUsername - facebook username
 * @param {function} next - callback
 */
UserService.prototype.createUsingFacebook = function createUsingFacebook(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.email) return next(new errors.InvalidArgumentError('Email is required'));
  if (!options.facebookId) return next(new errors.InvalidArgumentError('Facebook Id is required'));

  var _this = this;

  options.email = options.email.toLowerCase();

  if (!REGEXES.email.test(options.email)) return next(new errors.InvalidArgumentError(options.email + ' is not a valid email address'));

  async.waterfall([
    function getUserByEmail(done) {
      _this.getByEmail({
        email: options.email
      }, done);
    },
    function createNewUser(foundUser, done) {
      if (foundUser) return done(new errors.InvalidArgumentError('A user with the email ' + options.email + ' already exists'));

      var user = new User();
      user.email = options.email.toLowerCase();
      user.active = true;
      user.created = Date.now();
      user.facebook.id = options.facebookId;
      user.facebook.username = options.facebookUsername;
      user.profilePic = DEFAULTIMAGEURL + randomNum(1, 4) + '.jpg'

      user.save(done);
    }
  ], function finish(err, newUser) {
    return next(err, newUser);
  });
};

/**
 * @param {object} options
 * @param {string} userId
 * @param {object} updates
 * @param {function} next - callback
 */
UserService.prototype.update = function update(options, next) {
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (!options.updates) return next(new errors.InvalidArgumentError('Updates is required'));

  var _this = this;
  var updates = options.updates;
  var user = null;

  async.waterfall([
    function findUserById(done) {
      _this.getById({
        userId: options.userId
      }, done);
    },
    function validateData_step(_user, done) {
      if (!_user) return done(new errors.InvalidArgumentError('No user exists with the id ' + options.userId));

      user = _user;

      validator.validateUpdate(user, options, done);
    },
    function updateUser(done) {
      user.firstName = updates.firstName ? updates.firstName : user.firstName;
      user.lastName = updates.lastName ? updates.lastName : user.lastName;
      user.location = updates.location ? updates.location : user.location;

      user.facebook.id = updates.facebook && updates.facebook.id ? updates.facebook.id : user.facebook.id;
      user.facebook.username = updates.facebook && updates.facebook.username ? updates.facebook.username : user.facebook.username;

      if (updates.social) {
        user.social.facebook = updates.social.facebook ? updates.social.facebook : user.social.facebook;
        user.social.gitHub = updates.social.gitHub ? updates.social.gitHub : user.social.gitHub;
        user.social.linkedIn = updates.social.linkedIn ? updates.social.linkedIn : user.social.linkedIn;
      }

      user.save(done);
    }
  ], function finish(err, results) {
    return next(err, results);
  });
};

/**
 * @param {object} options
 * @param {string} userId
 * @param {string} name
 * @param {object} updates
 * @param {function} next - callback
 */
UserService.prototype.createAssetTag = function createAssetTag(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));

  var _this = this;
  var user = null;
  var assetTag = null;

  async.waterfall([
    function findUserById_step(done) {
      _this.getById({
        userId: options.userId
      }, done);
    },
    function findAssetTag_step(_user, done) {
      if (!_user) return done(new errors.InvalidArgumentError('No user exists with the id ' + options.userId));

      user = _user;

      assetTagService.getOrCreateByName({
        name: options.name
      }, done);
    },
    function addTagToUser_step(_assetTag, done) {

      var existingAssetTag = _.find(user.assetTags, function(assetTag) {
        return assetTag.slug === _assetTag.slug;
      });

      if (existingAssetTag) return done(new errors.InvalidArgumentError(options.name + ' tag already exists. Cannot have duplicate tags'));

      assetTag = _assetTag;

      user.assetTags.push({
        name: assetTag.name,
        slug: assetTag.slug,
        description: options.description
      });

      user.save(done);
    }
  ], function finish(err, user) {
    if (err) return next(err);

    _this.emit(EVENTS.ASSET_TAG_USED_BY_USER, {
      assetTagName: assetTag.name
    });

    return next(null, assetTag);
  });
};

/**
 * @param {object} options
 * @param {array} [populate] - array of keys to populate
 * @param {function} next - callback
 */
UserService.prototype.getAll = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));

  var query = User.find({});

  if (options.select) {
    query.select(options.select);
  }

  query.limit(options.take && options.take <= MAX_TAKE ? options.take : TAKE);

  return query.exec(next);
};

/**
 * @param {object} options
 * @param {string} userId - user's id
 * @param {array} [populate] - array of keys to populate
 * @param {function} next - callback
 */
UserService.prototype.getById = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var query = User.findOne({
    _id: options.userId
  });

  query.exec(function(err, user) {
    if (err) return next(err);
    if (!user) return next(new errors.ObjectNotFoundError('User not found'));

    next(null, user);
  });
};

/**
 * @param {object} options
 * @param {string} email - user's email
 * @param {string} [populate] - array of keys to populate
 * @param {function} next - callback
 */
UserService.prototype.getByEmail = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.email) return next(new errors.InvalidArgumentError('Email is required'));

  var query = User.findOne({
    email: options.email.toLowerCase()
  });

  query.exec(next);
};

/**
 * @param {object} options
 * @param {string} facebookId
 * @param {function} next - callback
 */
UserService.prototype.getByFacebookId = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.facebookId) return next(new errors.InvalidArgumentError('Facebook Id is required'));

  var query = User.findOne({
    'facebook.id': options.facebookId
  });

  query.exec(next);
};

/**
 * @param {object} options
 * @param {string} userId
 * @param {function} next - callback
 */
UserService.prototype.delete = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  User.findOneAndRemove({
    _id: options.userId
  }, next);
};

UserService.prototype.uploadImage = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (!options.fileName) return next(new errors.InvalidArgumentError('File Name is required'));
  if (!options.filePath) return next(new errors.InvalidArgumentError('File Path is required'));
  if (!options.fileType) return next(new errors.InvalidArgumentError('File Type is required'));
  if (!options.imageType) return next(new errors.InvalidArgumentError('Image Type is required'));

  var validUserImageTypes = [IMAGE_TYPES.PROFILE_PIC_USER];

  if (!_.contains(validUserImageTypes, options.imageType)) return next(new errors.InvalidArgumentError(options.imageType + ' is not a valid image type'));

  var _this = this;
  var user = null;

  async.waterfall([
    function getUserById_step(done) {
      _this.getById({
        userId: options.userId
      }, done);
    },
    function uploadImage_step(_user, done) {
      if (!_user) return done(new errors.InvalidArgumentError('No user exists with the id ' + options.userId));

      user = _user;

      imageService.upload({
        imageType: options.imageType,
        fileName: options.fileName,
        filePath: options.filePath,
        fileType: options.fileType
      }, done);
    },
    function addImageToUser_step(imageUrl, done) {
      var err = null;

      switch (options.imageType) {
        case IMAGE_TYPES.PROFILE_PIC_USER:
          user.profilePic = imageUrl;
          break
        default:
          err = new errors.InvalidArgumentError('Invalid image type');
          break;
      }

      if (err) {
        return done(err);
      } else {
        user.save(done);
      }
    }
  ], next);
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new UserService();
