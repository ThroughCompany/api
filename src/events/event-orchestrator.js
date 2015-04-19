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

//user event 1
var skillUsedByUserEvent = {
  name: USER_EVENTS.SKILL_USED_BY_USER,
  handlers: []
};
skillUsedByUserEvent.handlers.push(require('./handlers/user/skillUsedByUser'));
userEvents.events.push(skillUsedByUserEvent);

//user event 2
var userCreatedEvent = {
  name: USER_EVENTS.USER_CREATED,
  handlers: []
};
userCreatedEvent.handlers.push(require('./handlers/user/userCreated'));
userEvents.events.push(userCreatedEvent);


EVENTS.push(userEvents);

/* =========================================================================
 * Project Events
 * ========================================================================= */
var projectEvents = {
  module: 'modules/project',
  events: []
};

//project event 1
var skillUsedByProjectEvent = {
  name: PROJECT_EVENTS.SKILL_USED_BY_PROJECT,
  handlers: []
};
skillUsedByProjectEvent.handlers.push(require('./handlers/project/skillUsedByProject'));
projectEvents.events.push(skillUsedByProjectEvent);

//project event 2
var applicationCreated = {
  name: PROJECT_EVENTS.APPLICATION_CREATED,
  handlers: []
};
applicationCreated.handlers.push(require('./handlers/project/applicationCreated'));
projectEvents.events.push(applicationCreated);

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
