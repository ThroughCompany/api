/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');
var wikiPageSchema = require('./wikiPageSchema');

/* =========================================================================
 * Constants
 * ========================================================================= */

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
  social: {
    facebook: {
      type: String,
      trim: true
    },
    linkedIn: {
      type: String,
      trim: true
    }
  },
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
