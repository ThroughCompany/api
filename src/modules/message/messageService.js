/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var errors = require('modules/error');
var CommonService = require('modules/common');
var logger = require('modules/logger');

//models
var Message = require('modules/message/data/messageModel');
var User = require('modules/user/data/model');

/* =========================================================================
 * Constants
 * ========================================================================= */
var MESSAGE_TYPES = require('modules/message/constants/messageTypes');

/* =========================================================================
 * Constructor
 * ========================================================================= */
var MessageService = function() {
  CommonService.call(this, Message);
};
util.inherits(MessageService, CommonService);

/**
 * @param {object} options
 * @param {string} options.message
 * @param {string} options.text
 * @param {function} next - callback
 */
MessageService.prototype.create = function create(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));
  if (!options.message) return next(new errors.InvalidArgumentError('Message is required'));

  var _this = this;
  var user = null;

  async.waterfall([
      function findUserById_step(done) {
        User.findById(options.userId, function(err, _user) {
          if (err) return done(err);
          if (!_user) return done(new errors.ObjectNotFoundError('User not found'));

          user = _user;
          return done(null);
        });
      },
      function createMessage_step(done) {
        var message = new Message();
        message.message = options.message;
        message.user = user._id;
        message.type = MESSAGE_TYPES.RECEIVED;

        message.save(done);
      }
    ],
    next);
};

/**
 * @param {object} options
 * @param {string} options.userId
 * @param {function} next - callback
 */
MessageService.prototype.getByUserId = function getByUserId(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.userId) return next(new errors.InvalidArgumentError('User Id is required'));

  var _this = this;

  var conditions = {
    user: options.userId
  };

  var query = Message.find(conditions);

  return query.exec(next)
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new MessageService();
