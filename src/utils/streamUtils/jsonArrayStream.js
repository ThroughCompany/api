/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var stream = require('stream');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function JsonArrayStream() {
  stream.call(this);
  this.writable = true;
}
util.inherits(JsonArrayStream, stream);

JsonArrayStream.prototype.write = function(data) {
  if (!this._hasWritten) {
    this._hasWritten = true;
    this.emit('data', '[' + JSON.stringify(data));
  } else {
    this.emit('data', ',' + JSON.stringify(data));
  }
  return true;
};

JsonArrayStream.prototype.end = JsonArrayStream.prototype.destroy = function() {
  if (this._done) return;
  this._done = true;

  if (this._hasWritten) this.emit('data', ']');
  else this.emit('data', '[]');

  this.emit('end');
};

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = JsonArrayStream;
