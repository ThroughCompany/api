/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var fs = require('fs');

var errors = require('modules/error');

//services
var imageService = require('modules/image')

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

/** 
 * @description Get all users
 */
Controller.prototype.upload = function(req, res, next) {
  var files = req.files;

  if (!files.image) {
    return cleanup(files, function(err) {
      if (err) return next(err);
      return next(new errors.InvalidArgumentError('Image is required'));
    });
  }

  var image = files.image;

  imageService.upload({
    name: image.name,
    path: image.path
  }, function(err, users) {
    if (err) return next(err);
    return res.status(200).json(users);
  });
};

/* =========================================================================
 *  Private Helpers
 * ========================================================================= */
function cleanup(files, next) {
  async.each(files, function(file, done) {
    fs.unlink(file.path, done);
  }, next);
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
