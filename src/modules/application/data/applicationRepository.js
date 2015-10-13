'use strict';

const ApplicationModel = require('./applicationModel');
const CommonRepository = require('modules/common/data/commonRepository');

class ApplicationRepository extends CommonRepository {
  constructor() {
    super(ApplicationModel);
  }
}

module.exports = new ApplicationRepository();
