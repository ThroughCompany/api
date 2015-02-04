/* =========================================================================
 * Dependencies
 * ========================================================================= */
var config = require('app/config');
var Errors = require('app/config/error');
var _ = require('underscore');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function FieldSelectorTreeNode(memberName) {
  var _this = this;

  _this.memberName = memberName;
}

FieldSelectorTreeNode.prototype.getOrAddChildNode = function(memberName) {
  var _this = this;
  var exclude = false;

  memberName = memberName.trim();

  //remove exclusion flag
  if (memberName.charAt(0) === '-') {
    exclude = true;
    memberName = memberName.substring(1, memberName.length);
  }

  var childNode = _.find(_this.nodes, function(child) {
    return child.memberName === memberName;
  });

  if (!childNode) {
    childNode = new FieldSelectorTreeNode(memberName);

    if (!_this.nodes) {
      _this.nodes = [];
    }
    _this.nodes.push(childNode);
  }

  childNode.exclude = exclude;

  return childNode;
};

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = FieldSelectorTreeNode;
