process.env.NODE_ENV = 'test';

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');
var _ = require('underscore');
var mongoose = require('mongoose');

var app = require('src');
var appConfig = require('src/config/app-config');

var agent = require('tests/lib/agent');

/* =========================================================================
 * Before
 * ========================================================================= */
before(function(next) {
  console.log('\n--------------------------------------------\nRUNNING TEST SETUP...\n--------------------------------------------');

  next();
});

before(function(next) {
  console.log('\nDROPPING MONGO DB...');

  var conn = mongoose.createConnection(appConfig.db);

  conn.once('open', function() {
    conn.db.collectionNames(function(err, names) {
      if (err) return next(err);

      // if no errors then we have a collection drop the database
      conn.db.dropDatabase(function(err, result) {
        if (err) return next(err);

        console.log('MONGO DB DROPPED');

        next(err);
      });
    });
  });
});

before(function(next) {
  app.init({
    http: true
  }, next);
});

before(function(next) {
  var httpConfig = require('src/config/http-config');

  httpConfig.init(function(err, expressConfig) {
    console.log('\nSTARTING TEST AGENT...');


    agent.init(expressConfig.app);

    console.log('TEST AGENT STARTED...');
    next();
  });
});

before(function(next) {
  console.log('\n--------------------------------------------\nFINISHED RUNNING TEST SETUP\n--------------------------------------------');

  next();
});
