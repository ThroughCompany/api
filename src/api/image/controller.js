// /* =========================================================================
//  * Dependencies
//  * ========================================================================= */
// var async = require('async');
// var fs = require('fs');

// var errors = require('modules/error');

// //services
// var imageService = require('modules/image')

// /* =========================================================================
//  * Controller
//  * ========================================================================= */
// function Controller() {}

// /** 
//  * @description Upload an image
//  *
//  * @returns {string} url - image url
//  */
// Controller.prototype.upload = function(req, res, next) {
//   var files = req.files;

//   if (!files.image) {
//     return cleanup(files, function(err) {
//       if (err) return next(err);
//       return next(new errors.InvalidArgumentError('Image is required'));
//     });
//   }

//   var image = files.image;

//   imageService.upload({
//     imageType: '',
//     fileName: image.name,
//     filePath: image.path,
//     fileType: image.type
//   }, function(err, users) {
//     if (err) return next(err);
//     return res.status(200).json(users);
//   });
// };

// /* =========================================================================
//  *  Private Helpers
//  * ========================================================================= */

// /** 
//  * @description Delete a set of files
//  *
//  * @param {array} filePaths - array of file paths
//  * @param {function} next - callback
//  */
// function cleanup(filePaths, next) {
//   async.each(filePaths, function(filePath, done) {
//     fs.unlink(filePath, done);
//   }, next);
// }

// /* =========================================================================
//  * Expose
//  * ========================================================================= */
// module.exports = new Controller();
