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
var NEED_EVENTS = require('modules/need/constants/events');
var APPLICATION_EVENTS = require('modules/application/constants/events');

/* =========================================================================
 * User Events
 * ========================================================================= */
var userEvents = {
  module: 'modules/user',
  events: []
};

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

EVENTS.push(projectEvents);

/* =========================================================================
 * Need Events
 * ========================================================================= */
var needEvents = {
  module: 'modules/need',
  events: []
};

var skillUsedEvent = {
  name: NEED_EVENTS.SKILL_USED,
  handlers: []
};
skillUsedEvent.handlers.push(require('./handlers/need/skillUsed'));
needEvents.events.push(skillUsedEvent);

EVENTS.push(needEvents);

/* =========================================================================
 * Application Events
 * ========================================================================= */
var applicationEvents = {
  module: 'modules/application',
  events: []
};

var applicationCreated = {
  name: APPLICATION_EVENTS.APPLICATION_CREATED,
  handlers: []
};
applicationCreated.handlers.push(require('./handlers/application/applicationCreated'));
applicationEvents.events.push(applicationCreated);

EVENTS.push(applicationEvents);


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
          logger.debug('started handling event : \'' + event.name + '\'');

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
