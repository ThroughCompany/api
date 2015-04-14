/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');
var jsonPatch = require('fast-json-patch');
var uuid = require('node-uuid');

function Utils() {}

Utils.prototype.arraysAreEqual = function arraysAreEqual(array1, array2) {

  var _this = this;

  // if the other array is a falsy value, return
  if (!array1 || !array2)
    return false;

  // compare lengths - can save a lot of time 
  if (array1.length != array2.length)
    return false;

  for (var i = 0, l = array1.length; i < l; i++) {
    // Check if we have nested arrays
    if (array1[i] instanceof Array && array2[i] instanceof Array) {
      // recurse into the nested arrays
      if (_this.arraysAreEqual(array1[i]), array2[i])
        return false;
    } else if (array1[i] != array2[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
};

Utils.prototype.getServerErrorMessage = function getServerErrorMessage(response) {
  if (!response || !response.body) return null;
  if (!response.body.errors || !response.body.errors.length) return null;

  return response.body.errors[0].message;
};

Utils.prototype.guid = function guid() {
  return uuid.v4();
};

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new Utils();
