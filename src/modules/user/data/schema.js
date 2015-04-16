/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');

var utils = require('utils/utils');

/* =========================================================================
 * Constants
 * ========================================================================= */
var LINK_TYPES = require('modules/common/constants/linkTypes');

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
  userName: {
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
  socialLinks: [{
    _id: {
      type: String,
      default: utils.guid,
      required: true
    },
    type: {
      type: String,
      trim: true,
      required: true,
      enum: _.values(LINK_TYPES)
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    link: {
      type: String,
      trim: true,
      required: true
    }
  }],
  skills: [{
    _id: false,
    skill: {
      type: String,
      ref: 'Skill',
      required: true
    },
    name: {
      type: String,
      trim: true,
      required: true
    },
    slug: {
      type: String,
      trim: true,
      required: true
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
