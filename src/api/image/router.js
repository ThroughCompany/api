// /* =========================================================================
//  * Dependencies
//  * ========================================================================= */
// var express = require('express');
// var swagger = require('swagger-node-express');
// var multipart = require('connect-multiparty');

// //middleware
// var authMiddleware = require('src/middleware/authMiddleware');
// var multipartMiddleware = multipart();

// var controller = require('./controller');

// /* =========================================================================
//  * Swagger specs
//  * ========================================================================= */
// var upload = {
//   spec: {
//     path: '/images',
//     summary: 'Upload an image',
//     method: 'POST',
//     nickname: 'upload',
//     type: 'Image',
//     produces: ['application/json']
//   },
//   action: function(req, res, next) {
//     authMiddleware.authenticationRequired(req, res, function(err) {
//       if (err) return next(err);
//       multipartMiddleware(req, res, function(err) {
//         if (err) return next(err);
//         controller.upload(req, res, next);
//       });
//     });
//   }
// };

// swagger.addPost(upload);

// /* =========================================================================
//  *   Swagger declarations
//  * ========================================================================= */

// swagger.configureDeclaration('images', {
//   description: 'Operations for images',
//   produces: ['application/json']
// });
