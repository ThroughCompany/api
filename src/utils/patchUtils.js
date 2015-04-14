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
 * @param {array} allowedProperties - an array of whitelisted properties to limit patches
 */
PatchUtils.prototype.stripPatches = function stripPatches(allowedProperties, patches) {
  if (!allowedProperties || !patches) return null;

  var regexes = convertToRegexes(allowedProperties);

  // console.log('PATCHES BEFORE SCRUB');
  // console.log(patches);

  _.each(patches, function(patch) {
    if (matchesRegex(patch.path, regexes)) {
      patch.valid = true;
    }

    // if (_.isArray(patch.value)) {

    // } else {
    //   delete patch.value._id;
    // }
  });

  // console.log('PATCHES AFTER SCRUB');
  // console.log(patches);

  return _.filter(patches, function(patch) {
    return patch.valid;
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function convertToRegexes(allowedProperties) {
  return allowedProperties.map(function(prop) {
    return new RegExp('^\/{0,1}' + prop, 'i'); //checks if the path matches one of the whitelisted properties as either {path} or /{path}
  });
}

function matchesRegex(path, regexes) {
  var matches = false;

  for (var i = 0; i < regexes.length; i++) {
    var currentRegex = regexes[i];

    if (currentRegex.test(path)) {
      matches = true;
      break;
    }
  }

  return matches;
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new PatchUtils();
