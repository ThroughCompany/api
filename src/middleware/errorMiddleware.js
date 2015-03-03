/* =========================================================================
 * Depedencies
 * ========================================================================= */
//modules
var errors = require('modules/error');
var logger = require('modules/logger');

var appConfig = require('src/config/app-config');

/* =========================================================================
 * Middleware
 * ========================================================================= */
function Middleware(err, req, res, next) {
  var error = err;

  logger.error(error);

  // if err is a DB error then get more detail
  if (err.name === 'MongoError') {
    error = errors.handleDbError(err);
  }
  // if err is a DB error then get more detail
  if (err.name === 'ValidationError') {
    error = errors.handleMongooseValidationError(err);
  }

  // unauthorized user
  if (error instanceof errors.UnauthorizedError) {
    return res.status(401).json({
      message: 'Unauthorized',
      errors: errorMessageReponse(error)
    });
  }

  // forbidden
  if (error instanceof errors.ForbiddenError) {
    return res.status(403).json({
      message: 'Forbidden',
      errors: errorMessageReponse(error)
    });
  }

  if (error instanceof errors.InvalidArgumentError || (err.status && err.status === 400)) {
    return res.status(400).json({
      message: 'Bad request',
      errors: errorMessageReponse(error)
    });
  }

  // object not found error
  if (error instanceof errors.ObjectNotFoundError) {
    return res.status(404).json({
      message: 'Object not found',
      errors: errorMessageReponse(error)
    });
  }

  if (error instanceof errors.NotImplementedError) {
    return res.status(501).json({
      message: 'Not Implemented',
      errors: errorMessageReponse(error)
    });
  }

  if (error instanceof errors.InternalServiceError) {
    return res.status(501).json({
      message: 'Internal Service Error',
      errors: errorMessageReponse(error)
    });
  }

  res.status(500).json({
    message: 'Error',
    errors: internalMessageResponse(error)
  });
};

function internalMessageResponse(errorsParam) {
  return [{
    message: 'An unknown error occured'
  }];
}

function errorMessageReponse(errorsParam) {
  var errors = [].concat(errorsParam);

  var result = [];
  errors.forEach(function(error) {
    var errorJson = {
      message: error.toString()
    };
    var showStack = (appConfig.ENV_DEV);

    if (showStack) errorJson.stack = error.stack;

    result.push(errorJson);
  });
  return result;
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = Middleware;
