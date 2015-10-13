'use strict';

const PermissionModel = require('./model');
const CommonRepository = require('modules/common/data/commonRepository');

class PermissionRepository extends CommonRepository {
  constructor() {
    super(PermissionModel);
  }
}

module.exports = new PermissionRepository();
