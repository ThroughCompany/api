'use strict';

/* =========================================================================
 *
 *   Dependencies
 *
 * ========================================================================= */
var async = require('async');
var uuid = require('node-uuid');
var util = require('util');
var jwt = require('jwt-simple');
var fb = require('fb');

//services
var authService = require('modules/auth');

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

Controller.prototype.ping = function ping(req, res) {
  res.status(200).json({
    status: 'ok'
  });
};

/* =========================================================================
 *
 *   Exports
 *
 * ========================================================================= */
module.exports = new Controller();
