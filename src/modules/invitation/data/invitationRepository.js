'use strict';

const InvitationModel = require('./invitationModel');
const CommonRepository = require('modules/common/data/commonRepository');

class InvitatioRepository extends CommonRepository {
  constructor() {
    super(InvitationModel);
  }
}

module.exports = new InvitatioRepository();
