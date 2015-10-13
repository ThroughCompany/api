'use strict';

const OrganizationModel = require('./organizationModel');
const CommonRepository = require('modules/common/data/commonRepository');

class OrganizationRepository extends CommonRepository {
  constructor() {
    super(OrganizationModel);
  }
}

module.exports = new OrganizationRepository();
