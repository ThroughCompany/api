"use strict";

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var uuid = require('node-uuid');
var _ = require('underscore');

/* =========================================================================
 * Constants
 * ========================================================================= */
var ALLOWED_KEYS = [];
var RESTRICTED_KEYS = ['_id', 'modified', 'created'];
var POPULATE_PATHS = [];

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
var generateUniqueId = function() {
  return uuid.v4();
};

/* =========================================================================
 * Schema
 * ========================================================================= */
var baseSchemaData = {
  _id: {
    type: String,
    default: generateUniqueId,
    index: {
      unique: true
    }
  },
  created: {
    type: Date,
    required: true,
    default: Date.now
  },
  modified: {
    type: Date,
    required: true,
    default: Date.now
  }
};

var baseSchema = new mongoose.Schema(baseSchemaData);

/* =========================================================================
 * Hooks
 * ========================================================================= */
baseSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.modified = Date.now();
  }
  next();
});

/* =========================================================================
 * Statics
 * ========================================================================= */
_.extend(baseSchema.statics, {

});

/* =========================================================================
 * Statics
 * ========================================================================= */
_.extend(baseSchema.statics, {

});

/* =========================================================================
 * Methods
 * ========================================================================= */
_.extend(baseSchema.methods, {
  toJSON: function(options) {
    // base toJSON config object
    var toJSONConfig = _.clone(this.schema.options.toJSON);
    var res = mongoose.Document.prototype.toJSON.call(this, toJSONConfig);

    res.id = res._id;
    delete res.__v;
    delete res.__t;

    return res;
  },
  update: function(updates, next, allowAll) {
    var self = this;

    var allowed = (self.schema.statics.getAllowedKeys) ? ALLOWED_KEYS.concat(self.schema.statics.getAllowedKeys()) : ALLOWED_KEYS;
    var restricted = (self.schema.statics.getRestrictedKeys) ? RESTRICTED_KEYS.concat(self.schema.statics.getRestrictedKeys()) : RESTRICTED_KEYS;
    var allowedData = (allowAll) ? updates : {};

    if (!allowAll) {
      _.each(allowed, function(key) {
        if (key in updates) {
          allowedData[key] = updates[key];
        }
      })
    }
    _.each(restricted, function(key) {
      delete allowedData[key];
    });

    _.extend(self, allowedData);
    // NOTE: using save instead of an update because 
    // mongoose update does not enforce defaults, setters, validators
    self.save(next);
  }
});

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = baseSchema;
