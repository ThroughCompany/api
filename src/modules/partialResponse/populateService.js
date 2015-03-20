/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var path = require('path');
var _ = require('underscore');
var async = require('async');

//modules
var logger = require('modules/logger');
var errors = require('modules/error');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function PopulateService() {
  var _this = this;

  _this.populates = [];
}

PopulateService.prototype.populate = function populate(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
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
    var name = field.memberName;

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

  var idsToPopulate = [];
  var errorMsg = '';

  for (var i = 0; i < objects.length; i++) {
    var currentObj = objects[i];

    var val = getProperty(currentObj, options.key);

    if (val) {
      if (_.isArray(val)) {
        idsToPopulate = idsToPopulate.concat(val);
      } else {
        idsToPopulate.push(val);
      }
    } else {
      errorMsg = 'property ' + options.key + ' is not valid';

      logger.warn('missing property = ' + options.key);
    }
  }

  if (!idsToPopulate) {
    return next(new errors.InvalidArgumentError(errorMsg));
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

        query.exec(done);
      },
      function populateObjects_step(foundObjs, done) {

        foundObjs = _.indexBy(foundObjs, '_id');

        _.each(objects, function(object, index) {

          var propertyValue = getProperty(object, options.key);
          var foundObj;

          if (_.isArray(propertyValue)) {
            //TODO: need to handle an array of just strings AND an array of objects
            //current handles only an array of strings

            foundObj = [];

            _.each(propertyValue, function(val) {
              var found = foundObjs[val];
              if (found) foundObj.push(found);
            });
          } else {
            foundObj = foundObjs[getProperty(object, options.key)];
          }

          if (object) {
            object = (object && object.toJSON) ? object.toJSON() : object;
            foundObj = (foundObj && foundObj.toJSON) ? foundObj.toJSON() : foundObj;
            setProperty(object, options.key, foundObj);
          }
          objects[index] = object;
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

  if (propertyName.indexOf('.') > 0) {

    var parts = propertyName.split('.');
    var subObj = obj;

    for (var i = 0; i < parts.length; i++) {
      var currentPart = parts[i];

      //TODO: need to deal with getting array property
      // if (_.isArray(currentPart)) {
      //   _.each(currentPart, function(subPart) {
      //     if (subPart[currentPart]) {
      //       subObj = subObj[currentPart];
      //     } else {
      //       subObj = null;
      //       break;
      //     }
      //   });
      // } else {
      //   if (subObj[currentPart]) {
      //     subObj = subObj[currentPart];
      //   } else {
      //     subObj = null;
      //     break;
      //   }
      // }

      if (subObj[currentPart]) {
        subObj = subObj[currentPart];
      } else {
        subObj = null;
        break;
      }
    }

    return subObj;
  } else {
    return obj[propertyName] || null;
  }
}

/*
 * Fancy object property setter, allows settings a property by name on an object.
 * Supports dot notation in property name - ex. location.city
 *
 */
function setProperty(obj, propertyName, value) {

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

  return obj;
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = PopulateService;
