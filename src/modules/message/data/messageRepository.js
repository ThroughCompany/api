'use strict';

const MessageModel = require('./messageModel');
const CommonRepository = require('modules/common/data/commonRepository');

class MessageRepository extends CommonRepository {
  constructor() {
    super(MessageModel);
  }
}

module.exports = new MessageRepository();
