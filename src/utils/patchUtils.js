/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');
var jsonPatch = require('fast-json-patch');

function PatchUtils() {}

/**
 * @description Generates an array of patches from an object of updates/changes
 * @param {object} updates - a hash of updates to generate patches for
 */
PatchUtils.prototype.generatePatches = function generatePatches(updates) {
  if (!updates || !_.isObject(updates)) return [];

  var diff = jsonPatch.compare({}, updates);

  return diff;
};

/**
 * @description
 * @param {array} properties - an array of properties to strip from a set of patches
 */
PatchUtils.prototype.stripPatches = function stripPatches(properties, patches) {
  if (!properties || !patches) return null;

  _.each(patches, function(patch) {
    var patchPath = patch.path;

    if (properties.indexOf(patchPath) > -1 || properties.indexOf(patchPath.replace('/', '')) > -1) {
      patch.invalid = true;
    }
  });

  return _.filter(patches, function(patch) {
    return !patch.invalid;
  });
};

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new PatchUtils();
