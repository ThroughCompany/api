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
var PROJECT_STATUSES = require('modules/project/constants/projectStatuses');

/* =========================================================================
 * Schema
 * ========================================================================= */
var projectSchema = baseSchema.extend({
  name: {
    type: String,
    trim: true,
    required: true
  },
  status: {
    type: String,
    trim: true,
    required: true,
    enum: _.values(PROJECT_STATUSES)
  },
  slug: {
    type: String,
    trim: true,
    required: true,
    index: {
      unique: true
    }
  },
  description: {
    type: String,
    trim: true
  },
  wiki: {
    pages: [{
      _id: {
        type: String,
        default: utils.guid,
        index: {
          unique: true
        }
      },
      title: {
        type: String,
        trim: true,
        required: true
      },
      text: {
        type: String,
        trim: true
      }
    }]
  },
  profilePic: {
    type: String,
    trim: true
  },
  bannerPic: {
    type: String,
    trim: true
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
  projectUsers: [{
    type: String,
    ref: 'ProjectUser'
  }],
  //applications
  applications: [{
    type: String,
    ref: 'Application'
  }],
  //invitations
  invitations: [{
    type: String,
    ref: 'Invitation'
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
  //organization
  organizationProject: {
    type: String,
    ref: 'OrganizationProject'
  }
}, {
  collection: 'projects'
});

/* =========================================================================
 * Statics
 * ========================================================================= */
_.extend(projectSchema.statics, {});

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = projectSchema;
