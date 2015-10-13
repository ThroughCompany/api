'use strict';

const ProjectUserModel = require('./userModel');
const CommonRepository = require('modules/common/data/commonRepository');

class ProjectUserRepository extends CommonRepository {
  constructor() {
    super(ProjectUserModel);
  }
}

module.exports = new ProjectUserRepository();
