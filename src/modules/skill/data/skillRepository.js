'use strict';

const SkillModel = require('./model');
const CommonRepository = require('modules/common/data/commonRepository');

class SkillRepository extends CommonRepository {
  constructor() {
    super(SkillModel);
  }
}

module.exports = new SkillRepository();
