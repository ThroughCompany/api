'use strict';

const OrganizationProjectModel = require('./projectModel');
const CommonRepository = require('modules/common/data/commonRepository');

class OrganizationProjectRepository extends CommonRepository {
  constructor() {
    super(OrganizationProjectModel);
  }
}

module.exports = new OrganizationProjectRepository();
