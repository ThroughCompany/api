/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');
var stream = require('stream');

/* =========================================================================
 * Constructor
 * ========================================================================= */
function TransformStream() {
  stream.Transform.call(this, {
    objectMode: true
  });
}
util.inherits(TransformStream, stream.Transform);

TransformStream.prototype._transform = function(chunk, encoding, done) {
  this.push(chunk);
  done(null);
};

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = TransformStream;
