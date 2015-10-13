'use strict';

// const errors = require('modules/error');
/* =========================================================================
 * Dependencies
 * ========================================================================= */

/*
 * @class CommonRepository
 */
class CommonRepository {
  constructor(model) {
    if (!model) {
      console.warn('CommonRepository - model is required');
    }

    this.model = model;
  }

  // findById(id, options, next) {
  //
  // }
}

module.exports = CommonRepository;
