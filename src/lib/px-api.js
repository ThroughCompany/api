/* =========================================================================
 * Dependencies
 * ========================================================================= */
var fs = require('fs');
var async = require('async');
var uuid = require('node-uuid');

var appConfig = require('src/config/app-config');

var px = require('6px')({
  userId: appConfig.px.userId,
  apiKey: appConfig.px.apiKey,
  apiSecret: appConfig.px.apiSecret
});

//modules
var errors = require('modules/error');

/* =========================================================================
 * Consructor
 * ========================================================================= */
function PxApi() {}

/**
 * @description Upload a file to the proflie pic bucket
 *
 * @param {object} options
 * @param {string} options.imageUrl
 * @param {function} next - callback
 * @returns {string} url - image url
 */
PxApi.prototype.uploadImage = function uploadImage(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.imageUrl) return next(new errors.InvalidArgumentError('Image Url is required'));

  px.on('connection', function() {
    var image = px({
      taxi: options.imageUrl
    });

    var output = image.output({
        taxi: 'unsplashed_taxi'
      })
      .url('6px')
      .filter({
        sepia: 70
      })
      .resize({
        height: 200,
        width: 200
      });

    image.save().then(function(response) {
      console.log('RESPONSE FROM PX');
      console.log(response);
    }, function(response) {
      console.log('RESPONSE FROM PX');
      console.log(response);
    });

    image.getInfo().then(function(res) {
      console.log('Res', res);
    }, function(err) {
      console.log('Err', err);
    });
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */

/* =========================================================================
 * Export
 * ========================================================================= */
module.exports = new PxApi();
