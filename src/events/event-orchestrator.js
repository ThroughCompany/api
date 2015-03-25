/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');

//modules
var logger = require('modules/logger');

/* =========================================================================
 * Constants
 * ========================================================================= */
var EVENTS = [];
var USER_EVENTS = require('modules/user/constants/events');
var PROJECT_EVENTS = require('modules/project/constants/events');

/* =========================================================================
 * User Events
 * ========================================================================= */
var userEvents = {
  module: 'modules/user',
  events: []
};

var assetTagUsedByUserEvent = {
  name: USER_EVENTS.ASSET_TAG_USED_BY_USER,
  handlers: []
};
assetTagUsedByUserEvent.handlers.push(require('./handlers/user/asset-tag-used-by-user'));
userEvents.events.push(assetTagUsedByUserEvent);

EVENTS.push(userEvents);

/* =========================================================================
 * Project Events
 * ========================================================================= */
var projectEvents = {
  module: 'modules/project',
  events: []
};

var assetTagUsedByProjectEvent = {
  name: PROJECT_EVENTS.ASSET_TAG_USED_BY_PROJECT,
  handlers: []
};
assetTagUsedByProjectEvent.handlers.push(require('./handlers/project/asset-tag-used-by-project'));
projectEvents.events.push(assetTagUsedByProjectEvent);

EVENTS.push(projectEvents);

/* =========================================================================
 * Constructor
 * ========================================================================= */
function EventOrchestrator() {}

EventOrchestrator.prototype.registerHandlers = function() {
  _.each(EVENTS, function(eventGroup) {
    var module = require(eventGroup.module);

    _.each(eventGroup.events, function(event) {
      logger.info('REGISTER EVENT - ' + event.name);

      _.each(event.handlers, function(handler) {
        logger.info('Module \'' + eventGroup.module + '\' listening to \'' + event.name + '\' event - ' + event.handlers.length + ' handlers');

        module.on(event.name, function() {
          logger.debug('starting handling event : \'' + event.name + '\'');

          var args = Array.prototype.slice.call(arguments);
          args.push(function(err) {
            if (err) {
              logger.error('error during event : \'' + event.name + '\'');
              logger.error(err);
              logger.error(err.stack);
            } else {
              logger.debug('finished handling event : \'' + event.name + '\'');
            }
          });

          handler.apply(null, args);
        });
      });
    });
  });
};

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new EventOrchestrator();
