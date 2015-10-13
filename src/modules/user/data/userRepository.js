'use strict';

const UserModel = require('./model');
const CommonRepository = require('modules/common/data/commonRepository');

class UserRepository extends CommonRepository {
  constructor() {
    super(UserModel);
  }
}

module.exports = new UserRepository();
