/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var fs = require('fs');

//lib
var mailchimpApi = require('lib/mailchimp-api');

var errors = require('modules/error');

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

/** 
 * @description Get all users
 */
Controller.prototype.subscribe = function(req, res, next) {
  var email = req.body.email;

  mailchimpApi.subscribe({
    email: email
  }, function(err, response) {
    if (err) return next(err);
    return res.status(200).json(response);
  });
};

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
