/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var stream = require('stream');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function JsonStream() {
  stream.call(this);
  this.writable = true;
}
util.inherits(JsonStream, stream);

JsonStream.prototype.write = function(data) {
  this.emit('data', JSON.stringify(data));
  return true;
};

JsonStream.prototype.end = JsonStream.prototype.destroy = function() {
  if (this._done) return;
  this._done = true;

  this.emit('end');
};

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = JsonStream;
