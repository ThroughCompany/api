/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var baseSchema = require('modules/common/data/base-schema');
var wikiPageSchema = require('./wikiPageSchema');

var utils = require('utils/utils');

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
  projectApplications: [{
    type: String,
    ref: 'ProjectApplication'
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
