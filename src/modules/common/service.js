'use strict';

/* =========================================================================
 * Dependencies
 * ========================================================================= */
const util = require('util');
const EventEmitter = require('events').EventEmitter;

const CommonRepository = require('./data/commonRepository');

/* =========================================================================
 * Constructor
 * ========================================================================= */
class CommonService extends EventEmitter {
  constructor(repository) {
    super();

    if (!repository) {
      console.warn('CommonService - repository is required');
    }
    if (!(repository instanceof CommonRepository)) {
      console.warn('CommonService - repository is not an instanceof CommonRepository');
    }

    this._repository = repository;
    this.SKIP = 10;
    this.LIMIT = 50;
  }
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = CommonService;
