/* =========================================================================
 * Dependencies
 * ========================================================================= */


/* =========================================================================
 * Constructor
 * ========================================================================= */
function TestUtils() {}

TestUtils.prototype.getServerErrorMessage = function getServerErrorMessage(response) {
  if (!response || !response.body) return null;
  if (!response.body.errors || !response.body.errors.length) return null;

  return response.body.errors[0].message;
};

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = new TestUtils();
