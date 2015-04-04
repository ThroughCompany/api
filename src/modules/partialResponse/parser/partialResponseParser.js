// * ported from : https://github.com/AnthonyCarl/ServiceStack.PartialResponse/blob/master/src/ServiceModel/ServiceStack.PartialResponse.ServiceModel/FieldSelectorParser.cs

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

var logger = require('modules/logger');
var errors = require('modules/error');

var FieldSelectorTreeNode = require('./fieldSelectorTreeNode');
var FieldsCollection = require('./fieldsCollection');

/* =========================================================================
 * Constants
 * ========================================================================= */
var MULTIPLE_FIELD_SELECTOR = ',';
var NESTED_FIELD_SELECTOR = '/';
var BEGIN_SUB_SELECT_EXPRESSION = '(';
var END_SUB_SELECT_EXPRESSION = ')';

/* =========================================================================
 * Constructor
 * ========================================================================= */
function PartialResponseParser() {}

PartialResponseParser.prototype.parse = function(options, next) {
  if (!options) return next(new errors.InvalidArgumentError('options is required'));
  if (!options.fields) return next(null, null);
  if (options.fields && !_.isString(options.fields)) return next(new errors.InvalidArgumentError('options.fields must be a string'));

  var fields = options.fields.trim();

  parseStringIntoFields(fields, function(err, fields) {
    if (err) return next(err);
    if (!fields) return next(new errors.InvalidArgumentError('Error parsing fields'));

    var fieldsValid = true;

    var containsExclusions = false;

    for (var i = 0; i < fields.length; i++) {
      var currentField = fields[i];

      if (currentField.exclude) {
        containsExclusions = true;
        break;
      }
    }

    //mongo doesn't like include and exclude select expressions at the same time, so don't alow it
    fieldsValid = validateNodes(fields);

    if (!fieldsValid) {
      return next(new errors.InvalidArgumentError('fields cannot contain both include and exclude expressions'));
    }

    var results = {
      fields: new FieldsCollection(fields),
      expands: new FieldsCollection(fields)
    };

    results.fields = cleanSelectCollection(results.fields);
    results.expands = cleanExpandCollection(results.expands);

    // console.log('-------------------- FIELDS --------------------');
    // logExpandField(results.fields);

    // console.log('-------------------- EXPANDS --------------------');
    // logExpandField(results.expands);

    next(null, results);
  });
};

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function parseStringIntoFields(fields, next) {
  if (!fields) return next(null, null);

  if (startsWithReservedToken(fields)) {
    return next(new errors.InvalidArgumentError('A reserved token can not be the first character of the fields selector'));
  }

  var results;

  try {
    results = parseString(fields);
  } catch (err) {
    logger.error('Error parsing fields');
    console.log(err);
    results = null;
  }

  next(null, results ? results.nodes : null);
}

function parseString(fields) {
  var subSelectStack = [];
  var nestedStack = [];
  var currentMemberName = '';
  var parent = new FieldSelectorTreeNode('');
  var childNode = null;

  for (var i = 0; i < fields.length; i++) {
    var currentChar = fields[i];

    switch (currentChar) {
      case NESTED_FIELD_SELECTOR:
        if (currentMemberName.length === 0) {
          throw new Error('Nested Field token ' + NESTED_FIELD_SELECTOR + ' can not be preceeded by another reserved token.');
        }
        childNode = parent.getOrAddChildNode(currentMemberName);
        currentMemberName = '';

        nestedStack.push(parent);
        parent = childNode;

        break;
      case MULTIPLE_FIELD_SELECTOR:
        if (currentMemberName.length !== 0) {
          childNode = parent.getOrAddChildNode(currentMemberName);

          currentMemberName = '';
        }
        while (nestedStack.length > 0) {
          parent = nestedStack.pop();
        }

        break;
      case BEGIN_SUB_SELECT_EXPRESSION:
        if (currentMemberName.length === 0) {
          throw new Error('Begin Subselection token ' + BEGIN_SUB_SELECT_EXPRESSION + ' can not be preceeded by another reserved token.');
        }

        childNode = parent.getOrAddChildNode(currentMemberName);
        currentMemberName = '';

        subSelectStack.push(parent);
        parent = childNode;

        nestedStack = [];

        break;
      case END_SUB_SELECT_EXPRESSION:
        if (currentMemberName.length !== 0) {
          childNode = parent.getOrAddChildNode(currentMemberName);

          currentMemberName = '';
        }

        //if were are on a ) char, and the current parent node has no children our
        //fields looks like this (ex. venue())
        //which means select and populate
        //create an empty array so we know to use as a expand expression
        if (!parent.nodes) {
          parent.nodes = [];
        }

        parent = subSelectStack.pop();
        nestedStack = [];

        break;
      default:
        currentMemberName += currentChar;
    }
  }

  if (currentMemberName.length > 0) {
    childNode = parent.getOrAddChildNode(currentMemberName);

    while (nestedStack.length > 0) {
      parent = nestedStack.pop();
    }
  }

  return parent;
}

function validateNodes(nodes) {
  var includeNodes = _.where(nodes, {
    exclude: false
  });
  var excludeNodes = _.where(nodes, {
    exclude: true
  });

  if ((includeNodes && includeNodes.length) && (excludeNodes && excludeNodes.length)) {
    if (_.every(includeNodes, function(node) {
        return node.hasOwnProperty('nodes') && _.isArray(node.nodes);
      })) {
      return true;
    } else {
      return false;
    }
  } else {
    var childrenAreValid = true;

    _.each(nodes, function(childNode) {
      if (childNode.nodes) {
        childrenAreValid = validateNodes(childNode.nodes);
      }
    });

    return childrenAreValid;
  }
}

function startsWithReservedToken(fields) {
  var firstChar = fields.charAt(0);

  var reservedTokens = [
    ',',
    '(',
    ')',
    '/',
    '=',
    '+'
  ];

  return _.contains(reservedTokens, firstChar);
}

//helper for recursively logging fields and children
function logExpandField(fields, log) {
  if (log) {
    console.log(log);
  }
  _.each(fields, function(field) {
    console.log(field);

    if (field.nodes) {
      logExpandField(field.nodes, '----children----');
    }
  });
}

function cleanExpandCollection(collection) {
  collection.nodes = cleanExpandNodes(collection.nodes);

  collection.generateSelect();

  return collection;
}

function cleanSelectCollection(collection) {
  collection.nodes = cleanSelectNodes(collection.nodes);

  collection.generateSelect();

  return collection;
}

function cleanExpandNodes(nodes) {

  var validNodes = [];

  if (nodes && nodes.length) {
    _.each(nodes, function(childNode) {
      //just needs to have a nodes property that is an array, can be empty
      //array signifies that it should be expanded (ex. venue(name), or venue())
      if (childNode.hasOwnProperty('nodes') && _.isArray(childNode.nodes)) {
        validNodes.push(childNode);

        cleanExpandNodes(childNode);
      }
    });
  }

  return validNodes;
}

function cleanSelectNodes(nodes) {

  var includeNodes = _.where(nodes, {
    exclude: false
  });
  var excludeNodes = _.where(nodes, {
    exclude: true
  });

  //if we only have include expressions and they are all populate includes (), then
  //remove them all, this allows us to (-inventory, -city, venue()), which would otherwise fail because
  //it contains both inclusions and exclusions
  //
  //because we only have a fields property we can allow for both a select and populate, and populate and no-select
  //ex. venue() - this used to populate and select just venue, but how do we just populate without only selecting venue?

  if (includeNodes && includeNodes.length && _.every(includeNodes, function(node) {
      return node.hasOwnProperty('nodes') && _.isArray(node.nodes);
    })) {
    //console.log('CONTAINS ONLY POPULATE INCLUSIONS - REMOVING SELECTS');

    _.each(includeNodes, function(node) {
      var index = includeNodes.indexOf(node);
      includeNodes.splice(index, 1);
    });
  }

  if ((includeNodes && includeNodes.length) && (excludeNodes && excludeNodes.length)) {
    //if we have both include and exclude expression, which usually isn't allowed,
    //check if all the inclusions are populate inclusions (ex. venue()), if so remove them
    //this allows you to do (venue(), -inventory) - which usual isn't valid because it's 
    //an inclusion and exclusion select

    if (_.every(includeNodes, function(node) {
        return node.hasOwnProperty('nodes') && _.isArray(node.nodes);
      })) {
      _.each(includeNodes, function(node) {
        var index = includeNodes.indexOf(node);
        includeNodes.splice(index, 1);
      });
    }
  }

  nodes = includeNodes.concat(excludeNodes);

  if (nodes && nodes.length) {
    _.each(nodes, function(childNode) {
      if (childNode.hasOwnProperty('nodes') && _.isArray(childNode.nodes)) {
        cleanExpandNodes(childNode);
      }
    });
  }

  return nodes;
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new PartialResponseParser();
