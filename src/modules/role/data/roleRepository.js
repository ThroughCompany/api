'use strict';

const RoleModel = require('./model');
const CommonRepository = require('modules/common/data/commonRepository');

class RoleRepository extends CommonRepository {
  constructor() {
    super(RoleModel);
  }
}

module.exports = new RoleRepository();
