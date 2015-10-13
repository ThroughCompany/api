'use strict';

class CommonRepository {
  constructor(model) {
    if (!model) {
      console.warn('CommonRepository - model is required');
    }

    this.model = model;
  }
}

module.exports = CommonRepository;
