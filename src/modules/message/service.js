// "use strict";

// /* =========================================================================
//  * Dependencies
//  * ========================================================================= */
// var nodemailer = require('nodemailer');

// var appConfig = require('src/config/app-config');

// var smtpTransport = nodemailer.createTransport('SMTP', {
//   host: appConfig.smtp.credentials.host,
//   port: appConfig.smtp.credentials.port,
//   auth: {
//     user: appConfig.smtp.credentials.user,
//     pass: appConfig.smtp.credentials.password
//   }
// });

// /* =========================================================================
//  * Constructor
//  * ========================================================================= */
// function EmailService() {}

// EmailService.prototype.sendEmail = function(options) {
//   if (!options) throw new Error('options argument is required.');
//   if (!options.from) throw new Error('options.from argument is required.');
//   if (!options.to) throw new Error('options.to argument is required.');
//   if (!options.body) throw new Error('options.body argument is required.');
//   options.callback = options.callback || function() {};

//   var mailOptions = {
//     from: options.from,
//     to: options.to,
//     subject: options.subject,
//     html: options.body
//   };

//   smtpTransport.sendMail(mailOptions, options.callback);

//   return;
// };

// /* =========================================================================
//  * Expose
//  * ========================================================================= */
// module.exports = new EmailService();
