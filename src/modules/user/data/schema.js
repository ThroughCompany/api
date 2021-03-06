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
    // contributions: [{
    //   need: {
    //     type: String,
    //     ref: 'Need'
    //   },
    //   url: {
    //     type: String,
    //     trim: true
    //   }
    // }]
  }],
  //needs
  needs: [{
    type: String,
    ref: 'Need'
  }],
  openNeedsCount: {
    type: Number,
    default: 0
  },
  //projects
  projectUsers: [{
    type: String,
    ref: 'ProjectUser'
  }],
  //applications
  applications: [{ //applications for this user's needs
    type: String,
    ref: 'Application'
  }],
  createdApplications: [{ //application this user has created for other needs
    type: String,
    ref: 'Application'
  }],
  //invitations
  invitations: [{
    type: String,
    ref: 'Invitation'
  }],
  //organizations
  organizationUsers: [{
    type: String,
    ref: 'OrganizationUser'
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
 * Virtuals 
 * ========================================================================= */
userSchema.virtual('name')
  .get(function() {
    return this.firstName ? (this.firstName + ' ' + this.lastName) : this.userName;
  });

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = userSchema;
