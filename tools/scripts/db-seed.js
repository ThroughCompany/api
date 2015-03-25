/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');
var argv = require('yargs').usage('Usage: -createAdmins').argv;

var app = require('src');

var dbSeed = require('../db-seed');

/* =========================================================================
 * Run
 * ========================================================================= */
dbSeed.run({
  createAdmins: argv.createAdmins === 'false' ? false : true
}, function() {
  process.exit(0);
});
