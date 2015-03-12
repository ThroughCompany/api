/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');
var argv = require('yargs').usage('Usage: -createAdmins').argv;

var app = require('src');

var dbSeed = require('../db-seed');

console.log(argv);

/* =========================================================================
 * Run
 * ========================================================================= */
dbSeed.run({
  createAdmins: argv.createAdmins
}, function() {
  process.exit(0);
});
