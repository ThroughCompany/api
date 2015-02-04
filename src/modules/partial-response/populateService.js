/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var config = require('app/config');
var path = require('path');
var Errors = require(path.join(config.paths.config, 'error'));
var _ = require('underscore');
var async = require('async');

//modules
var logger = require('modules/logger');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function PopulateService() {
  var _this = this;

  _this.populates = [];
}

PopulateService.prototype.populate = function populate(options, next) {
  if (!options) return next(new Errors.InvalidArgumentError('options is required'));
  //if (!options.doc && !options.docs) return next(new Errors.InvalidArgumentError('options.doc or options.docs is required'));
  if (!options.doc && !options.docs) return next(null, null);
  if (options.docs) options.doc = options.docs;

  if (!options.expands || (!options.expands.nodes || !options.expands.nodes.length)) {
    logger.info('expands not passed, skipping populates');
    return next(null, options.doc);
  }

  if (_.isArray(options.doc) && !options.doc.length) {
    return next(null, options.doc);
  }

  var _this = this;
  var steps = [];

  var populateFunctions = [];

  _.each(options.expands.nodes, function(field) {
    var name = field.memberName.toLowerCase();

    var foundPopulateFn = _this.populates[name];

    if (foundPopulateFn) {
      populateFunctions.push(function(callback) {
        foundPopulateFn({
          doc: options.doc,
          select: field.select
        }, callback);
      });
    } else {
      logger.debug('populate not registered for member name : ' + name + ', skipping...');
    }
  });

  if (!populateFunctions || !populateFunctions.length) {
    return next(null, options.doc);
  }

  async.parallel(populateFunctions, function(err, results) {
    if (err) return next(err);
    next(null, results[0]);
  });
};

PopulateService.prototype.addPopulate = function addPopulate(options) {
  if (!options) throw new Error('options is required');
  if (!options.key) throw new Error('options.key is required');
  if (!options.model) throw new Error('options.model is required');

  var _this = this;

  var existingPopulate = _this.populates[options.key];

  if (existingPopulate) throw new Error(options.key + ' already has a populate');

  _this.populates[options.key] = function(opts, next) {
    opts.key = options.key;
    opts.model = options.model;

    if (!_.isArray(opts.doc)) {
      opts.doc = [opts.doc];

      populateCollection(opts, function(err, docs) {
        if (err) return next(err);

        next(err, docs[0]);
      });
    } else {
      populateCollection(opts, next);
    }
  };
};

function populateCollection(options, next) {
  var select = options.select;

  logger.debug('running populate for ' + options.key);

  var key = options.key;

  var objects = options.doc;

  //console.log(objects);

  var idsToPopulate = [];
  var errorMsg = '';

  for (var i = 0; i < objects.length; i++) {
    var currentObj = objects[i];

    var val = getProperty(currentObj, options.key);

    if (val) {
      idsToPopulate.push(val);
    } else {
      errorMsg = 'property ' + options.key + ' is not valid';
      break;
    }
  }

  // console.log('idsToPopulate');
  // console.log(idsToPopulate);

  if (!idsToPopulate) {
    return next(new Errors.InvalidArgumentError(errorMsg));
  }

  async.waterfall([
      function findObjectsByIds_step(done) {
        var query = options.model.find({
          _id: {
            $in: idsToPopulate
          }
        });

        if (select) {
          query.select(select);
        }

        //query.lean();

        query.exec(done);
      },
      function populateObjects_step(foundObjs, done) {
        _.each(objects, function(object) {

          var foundObject = _.findWhere(foundObjs, {
            _id: getProperty(object, options.key)
          });

          var index = objects.indexOf(object);

          var obj = object.toJSON ? object.toJSON() : object;

          var foundObj = foundObject.toJSON ? foundObject.toJSON() : foundObject;

          setProperty(obj, options.key, foundObj);

          objects[index] = obj;
        });

        done();
      }
    ],
    function(err) {
      next(null, options.doc);
    });
}

/*
 * Fancy object property getter, allows getting a property by name on an object.
 * Supports dot notation in property name - ex. location.city
 *
 */
function getProperty(obj, propertyName) {
  //console.log('GETTING prop : ' + propertyName);

  if (propertyName.indexOf('.') > 0) {

    var parts = propertyName.split('.');
    var subObj = obj;

    for (var i = 0; i < parts.length; i++) {
      var currentPart = parts[i];

      if (subObj[currentPart]) {
        subObj = subObj[currentPart];
      } else {
        subObj = null;
        break;
      }
    }

    return subObj;
  } else {
    if (obj[propertyName]) {
      return obj[propertyName];
    }
    return null;
  }
}

/*
 * Fancy object property setter, allows settings a property by name on an object.
 * Supports dot notation in property name - ex. location.city
 *
 */
function setProperty(obj, propertyName, value) {
  //console.log('SETTING prop : ' + propertyName);

  if (propertyName.indexOf('.') > 0) {

    var parts = propertyName.split('.');
    var subObj = obj;

    for (var i = 0; i < parts.length; i++) {
      var currentPart = parts[i];

      if (i === (parts.length - 1)) {
        subObj[currentPart] = value;
      } else {
        subObj = subObj[currentPart];
      }
    }

  } else {
    obj[propertyName] = value;
  }
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = PopulateService;
