/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');

/* =========================================================================
 * Constants
 * ========================================================================= */

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
  firstName: {
    type: String,
    default: '',
    trim: true
  },
  lastName: {
    type: String,
    default: '',
    trim: true
  },
  active: {
    type: Boolean,
    required: true,
    default: false
  },
  profilePic: {
    type: String,
    trim: true
  },
  projectUsers: [{
    type: String,
    ref: 'ProjectUser'
  }],
  projectApplications: [{
    type: String,
    ref: 'ProjectApplication'
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
  },
  location: {
    type: String,
    trim: true
  },
  social: {
    facebook: {
      type: String,
      trim: true
    },
    gitHub: {
      type: String,
      trim: true
    },
    linkedIn: {
      type: String,
      trim: true
    }
  },
  assetTags: [{
    _id: false,
    name: {
      type: String,
      trim: true
    },
    slug: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }]
});

/* =========================================================================
 * Hooks
 * ========================================================================= */
userSchema.pre('save', function(next) {

  if (this.facebook && this.facebook.id) {
    this.profilePic = "https://graph.facebook.com/" + this.facebook.id + "/picture?type=large";
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
