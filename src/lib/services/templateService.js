/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');
var handlebars = require('handlebars');
var fs = require('fs');

//modules
var errors = require('modules/error');
var logger = require('modules/logger');

/* =========================================================================
 * Constants
 * ========================================================================= */
var TEMPLATE_CACHE = {}; //key: filePath for the template, value: handlebars template fn

/* =========================================================================
 * Constructor
 * ========================================================================= */
function TemplateService() {}

/**
 * @param {object} options
 */
TemplateService.prototype.generate = function generate(options, next) {
  if (!options) return next(new errors.InternalServiceError('options is required'));
  if (!options.templateFilePath) return next(new errors.InternalServiceError('options.templateFilePath is required'));
  if (!options.templateData) return next(new errors.InternalServiceError('options.templateData is required'));

  var template = null;
  var getTemplate = null;

  if (TEMPLATE_CACHE[options.templateFilePath]) {
    getTemplate = function(done) {
      done(null, TEMPLATE_CACHE[options.templateFilePath]);
    };
  } else {
    getTemplate = function(done) {
      generateTemplate(options.templateFilePath, done);
    };
  }

  getTemplate(function(err, template) {
    var result = template(options.templateData);

    return next(null, result);
  });
};

/* =========================================================================
 * Handlebar Helpers
 * ========================================================================= */
// handlebars.registerHelper('day', function(date) {
//   var dateObj = moment(date).utc()
//   return dateObj.format("dddd");
// });

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function generateTemplate(filePath, next) {
  async.waterfall([
    function getFile_step(done) {
      readFile(filePath, done);
    },
    function generateTemplateFn(source, done) {
      var template = handlebars.compile(source);

      TEMPLATE_CACHE[filePath] = template;

      done(null, TEMPLATE_CACHE[filePath]);
    }
  ], next);
}

function readFile(filePath, next) {
  fs.readFile(filePath, 'utf8', next);
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new TemplateService();
