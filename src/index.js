/* =========================================================================
 * Constants
 * ========================================================================= */

/* =========================================================================
 * Dependencies
 * ========================================================================= */
if (process.env.NEWRELIC) {
  var newrelic = require('newrelic');
}

var async = require('async');
var _ = require('underscore');
var fs = require('fs');

var appConfig = require('src/config/app-config');
var httpConfig = require('src/config/http-config');
var mongoConfig = require('src/config/mongo-config');

/* NOTE: no app files, other than these config files should be loaded here 
  - our app files need to load (be required) after we connect to our databases
  - and set all the environment config settings to ensure any dependencies on these services
  - gets the service intialized with any config settings needed
*/
/* =========================================================================
 * Constructor
 * ========================================================================= */
function App() {}

/* =========================================================================
 * Init
 * ========================================================================= */
/**
 * init - main entry point for the entire app
 * - loads app files
 * - starts Mongo DB
 *
 * @param {Object} options
 * @param {Boolean} options.http - turns on the HTTP server
 * @param {Function} next - callback function
 *
 */
App.prototype.init = function init(options, next) {
  if (!options) throw new Error('options is required');

  next = next || function() {};

  if (options.worker === true) {
    appConfig.worker = true;
  }

  var steps = [];

  console.log('\n--------------------------------------------\nINITIALIZING APP...\n--------------------------------------------');
  console.log('-running in ' + appConfig.ENV + ' mode \r');
  console.log('-running initialize steps... \r');

  steps.push(function connectMongo_step(done) {
    mongoConfig.init(done);
  });

  steps.push(function loadModules_step(done) {
    var modules = fs.readdirSync('src/modules');

    _.each(modules, function(module) {

      if (module.substring(0, 1) !== '.') {
        console.log('Loading module : ' + module + '...');
        require('src/modules/' + module);
      }
    });

    done();
  });

  steps.push(function loadEvents_step(done) {
    var eventOrchestrator = require('src/events/event-orchestrator');

    eventOrchestrator.registerHandlers();

    done();
  });

  if (options.http) {
    steps.push(function startHttpServer_step(done) {
      httpConfig.init(done);
    });
  }

  runSteps(steps, function(err) {
    console.log('\n--------------------------------------------\nFINISHED INITIALIZING APP...\n--------------------------------------------');

    next(err);
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function functionName(fun) {
  var ret = fun.toString();
  ret = ret.substr('function '.length);
  ret = ret.substr(0, ret.indexOf('('));
  return ret;
}

function runSteps(steps, next) {
  var newSteps = [];

  _.each(steps, function(step) {
    newSteps.push(function(done) {
      var fnName = functionName(step);
      var index = steps.indexOf(step) + 1;

      console.log('\n' + index + ') - ' + fnName + ' ---------------------');

      step(done);
    });
  });

  async.series(newSteps, next);
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new App();
