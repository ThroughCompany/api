var uuid = require('node-uuid');

var generateUniqueId = function() {
  return uuid.v4();
};

console.log(generateUniqueId());
