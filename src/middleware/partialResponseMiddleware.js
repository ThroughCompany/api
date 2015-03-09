/* =========================================================================
 * Dependencies
 * ========================================================================= */
var PartialResponse = require('modules/partialResponse');

/* =========================================================================
 * Middleware
 * ========================================================================= */
function partialResponseMiddleware(req, res, next) {
  if (!req.query || !req.query.fields) {
    return next();
  }

  PartialResponse.parser.parse(req.query, function(err, result) {
    if (err) return next(err);

    req.fields = result.fields;
    req.expands = result.expands;

    next();
  });
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = partialResponseMiddleware;
