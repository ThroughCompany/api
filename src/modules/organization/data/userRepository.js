'use strict';

const OrganizationUserModel = require('./userModel');
const CommonRepository = require('modules/common/data/commonRepository');

class OrganizationUserRepository extends CommonRepository {
  constructor() {
    super(OrganizationUserModel);
  }
}

module.exports = new OrganizationUserRepository();
