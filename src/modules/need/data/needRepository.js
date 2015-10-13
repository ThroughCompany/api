'use strict';

const NeedModel = require('./needModel');
const CommonRepository = require('modules/common/data/commonRepository');

class NeedRepository extends CommonRepository {
  constructor() {
    super(NeedModel);
  }
}

module.exports = new NeedRepository();
