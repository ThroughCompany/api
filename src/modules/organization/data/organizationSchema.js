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
var organizationSchema = baseSchema.extend({
  name: {
    type: String,
    trim: true,
    required: true
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
  organizationUsers: [{
    type: String,
    ref: 'OrganizationUser'
  }],
  organizationProjects: [{
    type: String,
    ref: 'OrganizationProject'
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
  //applications
  applications: [{
    type: String,
    ref: 'Application'
  }],
  //invitations
  invitations: [{
    type: String,
    ref: 'Invitation'
  }]
});

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = organizationSchema;
