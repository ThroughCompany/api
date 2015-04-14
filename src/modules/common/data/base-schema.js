/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var uuid = require('node-uuid');
var _ = require('underscore');

var utils = require('utils/utils');

/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Schema
 * ========================================================================= */
var baseSchemaData = {
  _id: {
    type: String,
    default: utils.guid,
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
  }
});

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = baseSchema;
