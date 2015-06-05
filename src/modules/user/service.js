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
var imageService = require('modules/image');
var skillService = require('modules/skill');
var logger = require('modules/logger');
var userPopulateService = require('./populate/service');

//models
var User = require('./data/model');
var Auth = require('modules/auth/data/model');

//utils
var patchUtils = require('utils/patchUtils');
var authUtil = require('modules/auth/util');

var partialResponseParser = require('modules/partialResponse/parser');

var validator = require('./validator');

/* =========================================================================
 * Constants
 * ========================================================================= */
var TAKE = 50;
var MAX_TAKE = 200;

var EVENTS = require('./constants/events');
var REGEXES = require('modules/common/constants/regexes');
var DEFAULTIMAGEURL = 'https://s3.amazonaws.com/throughcompany-assets/images/profilepic_default.png';
var IMAGE_TYPES = require('modules/image/constants/image-types');

var UPDATEDABLE_USER_PROPERTIES = [
  'facebook',
  'firstName',
  'lastName',
  'location',
  'socialLinks'
];

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
  var userName;

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
    function generateUserName_step(foundUser, done) {
      if (foundUser) return done(new errors.InvalidArgumentError('A user with the email ' + options.email + ' already exists'));

      generateUserName(options.email, done);
    },
    function generatePasswordHash(_userName, done) {
      userName = _userName;

      authUtil.generatePasswordHashAndSalt(options.password, done);
    },
    function createNewUser(hash, done) {
      var user = new User();
      user.email = options.email;
      user.userName = userName;
      user.active = true;
      user.created = new Date();
      user.modified = user.created;
      user.profilePic = DEFAULTIMAGEURL;

      user.save(function(err, newUser) {
        done(err, newUser, hash);
      });
    },
    function createNewAuth(user, hash, done) {
      var auth = new Auth();
      auth.user = user._id;
      auth.hash = hash;
      auth.save(function(err) {
        done(err, user);
      });
    }
  ], function finish(err, newUser) {
    if (err) return next(err);

    _this.emit(EVENTS.USER_CREATED, {
      userId: newUser._id
    });

    return next(null, newUser);
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
    function generateUserName_step(foundUser, done) {
      if (foundUser) return done(new errors.InvalidArgumentError('A user with the email ' + options.email + ' already exists'));

      generateUserName(options.email, done);
    },
    function createNewUser(userName, done) {

      var user = new User();
      user.email = options.email.toLowerCase();
      user.userName = userName;
      user.active = true;
      user.created = Date.now();
      user.facebook.id = options.facebookId;
      user.facebook.username = options.facebookUsername;
      user.profilePic = DEFAULTIMAGEURL;

      user.save(done);
    }
  ], function finish(err, newUser) {
    if (err) return next(err);

    _this.emit(EVENTS.USER_CREATED, {
      userId: newUser._id
    });

    return next(null, newUser);
  });
};

/**
 * @param {object} options
 * @param {string} userId
 * @param {object} [updates] - a hash of changes to apply to the user
 * @param {array} [patches] - an array of JSON patches to apply to the user
 * @param {function} next - callback
 */
UserService.prototype.update = function update(options, next) {
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (!options.patches && !options.updates) return next(new errors.InvalidArgumentError('patches or updates is required'));
  if (options.patches && _.isEmpty(options.patches)) return next(new errors.InvalidArgumentError('patches must contain values'));
  if (options.updates && _.isEmpty(options.updates)) return next(new errors.InvalidArgumentError('updates must contain values'));
  if (options.patches && !_.isArray(options.patches)) return next(new errors.InvalidArgumentError('patches must be an array'));

  var _this = this;
  var user = null;
  var userClone = null;
  var patches = null;

  async.waterfall([
    function findUserById(done) {
      _this.getById({
        userId: options.userId
      }, done);
    },
    function validateData_step(_user, done) {
      if (!_user) return done(new errors.InvalidArgumentError('No user exists with the id ' + options.userId));

      user = _user;

      if (options.updates && !options.patches) patches = patchUtils.generatePatches(options.updates);
      else patches = options.patches;

      patches = patchUtils.stripPatches(UPDATEDABLE_USER_PROPERTIES, patches);

      userClone = _.clone(user.toJSON());

      var patchErrors = jsonPatch.validate(patches, userClone);

      if (patchErrors) {
        return done(patchErrors && patchErrors.message ? new errors.InvalidArgumentError(patchErrors.message) : patchErrors);
      }

      try {
        jsonPatch.apply(userClone, patches);
      } catch (err) {
        logger.error(err);

        return done(new errors.InvalidArgumentError('error applying patches'));
      }

      validator.validateUpdate(user, userClone, done);
    },
    function updateUser(done) {

      _.extend(user, userClone); //apply the updates from the clone

      user.save(done);
    }
  ], function finish(err, user) {
    return next(err, user); //don't remove, callback needed because mongoose save returns 3rd arg
  });
};

/**
 * @param {object} options
 * @param {string} userId
 * @param {string} name
 * @param {object} updates
 * @param {function} next - callback
 */
UserService.prototype.createSkill = function createSkill(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (!options.name) return next(new errors.InvalidArgumentError('Name is required'));

  var _this = this;
  var user = null;
  var skill = null;
  var userSkill = null;

  async.waterfall([
    function findUserById_step(done) {
      _this.getById({
        userId: options.userId
      }, done);
    },
    function findSkill_step(_user, done) {
      if (!_user) return done(new errors.InvalidArgumentError('No user exists with the id ' + options.userId));

      user = _user;

      skillService.getOrCreateByName({
        name: options.name
      }, done);
    },
    function addSkillToUser_step(_skill, done) {

      var existingSkill = _.find(user.skills, function(skill) {
        return skill.slug === _skill.slug;
      });

      if (existingSkill) return done(new errors.InvalidArgumentError(options.name + ' skill already exists. Cannot have duplicate skills'));

      skill = _skill;

      userSkill = {
        name: skill.name,
        skill: skill._id,
        slug: skill.slug,
        description: options.description
      };

      user.skills.push(userSkill);

      user.save(done);
    }
  ], function finish(err) {
    if (err) return next(err);

    _this.emit(EVENTS.SKILL_USED_BY_USER, {
      skillId: skill._id
    });

    return next(null, userSkill);
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
    function getUserById_step(done) {
      var query = User.findOne({
        $or: [{
          _id: options.userId
        }, {
          userName: options.userId
        }]
      });

      if (fields) {
        query.select(fields.select);
      }

      query.exec(function(err, user) {
        if (err) return done(err);
        if (!user) return done(new errors.ObjectNotFoundError('User not found'));

        return done(null, user);
      });
    },
    function populate_step(user, done) {
      if (!expands) return done(null, user);

      userPopulateService.populate({
        docs: user,
        expands: expands
      }, done);
    }
  ], next);
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

/* =========================================================================
 * Images
 * ========================================================================= */
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
          break;
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

function generateUserName(userEmail, next) {
  userEmail = userEmail.indexOf('@') > 0 ? userEmail.split('@')[0] : userEmail;
  var userName = userEmail.trim().replace(/\s/gi, '-').replace(/('|\.)/gi, '').toLowerCase();

  findUniqueUserName(userName, 0, next);
}

function findUniqueUserName(userName, attempts, next) {
  var newUserName = attempts > 0 ? userName + attempts : userName;

  findUserByUserName(newUserName, function(err, users) {
    if (!users || !users.length) return next(null, newUserName); //name is unique
    else { //not unique, bump attempt count, try again
      attempts = attempts + 1;
      findUniqueUserName(userName, attempts, next);
    }
  });
}

function findUserByUserName(userName, next) {
  var query = User.find({
    userName: userName
  });

  query.select('userName');

  query.exec(next);
}

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new UserService();
