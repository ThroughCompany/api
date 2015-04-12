/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');
var wikiPageSchema = require('./wikiPageSchema');

/* =========================================================================
 * Constants
 * ========================================================================= */
var LINK_TYPES = require('modules/common/constants/linkTypes');

/* =========================================================================
 * Schema
 * ========================================================================= */
var projectSchema = baseSchema.extend({
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
  wiki: {
    pages: [wikiPageSchema]
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
    _id: false,
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
  projectApplications: [{
    type: String,
    ref: 'ProjectApplication'
  }],
  assetTags: [{
    _id: false,
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
