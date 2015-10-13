'use strict';

const ProjectModel = require('./projectModel');
const CommonRepository = require('modules/common/data/commonRepository');

class ProjectRepository extends CommonRepository {
  constructor() {
    super(ProjectModel);
  }
}

module.exports = new ProjectRepository();
