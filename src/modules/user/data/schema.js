/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');

/* =========================================================================
 * Constants
 * ========================================================================= */
var DEFAULTIMAGEURL = 'https://s3.amazonaws.com/ThroughCompany_Assets/user-avatar.jpg';

/* =========================================================================
 * Schema
 * ========================================================================= */
var userSchema = baseSchema.extend({
  email: {
    type: String,
    trim: true,
    required: true,
    index: {
      unique: true
    }
  },
  firstname: {
    type: String,
    default: '',
    trim: true
  },
  lastname: {
    type: String,
    default: '',
    trim: true
  },
  active: {
    type: Boolean,
    required: true,
    default: false
  },
  imageUrl: {
    type: String,
    default: DEFAULTIMAGEURL
  },
  projectUsers: [{
    type: String,
    ref: 'ProjectUser'
  }],
  facebook: {
    id: {
      type: String,
      index: {
        unique: false,
        sparse: true
      }
    },
    username: {
      type: String,
      trim: true
    }
  }
});

/* =========================================================================
 * Hooks
 * ========================================================================= */
userSchema.pre('save', function(next) {

  if (this.facebook && this.facebook.id) {
    this.imageUrl = "https://graph.facebook.com/" + this.facebook.id + "/picture?type=large";
  }

  next();
});

/* =========================================================================
 * Statics
 * ========================================================================= */
_.extend(userSchema.statics, {});

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = userSchema;
