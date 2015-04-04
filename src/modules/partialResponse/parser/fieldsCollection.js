/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function FieldsCollection(fields) {
  var _this = this;

  _this.nodes = fields;

  _this.generateSelect = function() {
    _generateSelect(_this);
  };

  _this.generateSelect();
}

/* =========================================================================
 * Private Helpers
 * ========================================================================= */
function _generateSelect(node) {
  if (node.nodes && _.isArray(node.nodes)) {
    var fieldsObj = {};
    node.select = fieldsObj;

    _.each(node.nodes, function(childNode) {
      _generateSelect(childNode);

      fieldsObj[childNode.memberName] = childNode.exclude === true ? 0 : 1;
    });
  }
}

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = FieldsCollection;
