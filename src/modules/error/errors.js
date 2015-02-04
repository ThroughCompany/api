/* =========================================================================
 * Dependencies
 * ========================================================================= */
var util = require('util');

/* =========================================================================
 * Abstract Error
 * ========================================================================= */
var AbstractError = function(errorType) {
  Error.captureStackTrace(this, this)

  var isMessage = (typeof errorType === 'string');
  this.message = isMessage ? errorType : errorType.message;
};
util.inherits(AbstractError, Error);

AbstractError.prototype.name = 'Abstract Error';

AbstractError.prototype.toString = function() {
  return String(this.message);
};

/* =========================================================================
 * Database Error
 * ========================================================================= */
var DatabaseError = function() {
  AbstractError.call(this);
}
util.inherits(DatabaseError, AbstractError);
DatabaseError.prototype.name = 'Database Error';

/* =========================================================================
 * Object Not Found Error
 * ========================================================================= */
var ObjectNotFoundError = function(msg) {
  AbstractError.call(this, msg);
};
util.inherits(ObjectNotFoundError, AbstractError);
ObjectNotFoundError.prototype.name = 'Object not found Error';

/* =========================================================================
 * Not Implemented Error
 * ========================================================================= */
var NotImplementedError = function(msg) {
  AbstractError.call(this, msg);
};
util.inherits(NotImplementedError, AbstractError);
NotImplementedError.prototype.name = 'Method Not Implemented Error';

/* =========================================================================
 * Unauthorized Error
 * ========================================================================= */
var UnauthorizedError = function(msg) {
  AbstractError.call(this, msg);
};
util.inherits(UnauthorizedError, AbstractError);
UnauthorizedError.prototype.name = 'Unauthorized Error';

/* =========================================================================
 * Forbidden Error
 * ========================================================================= */
var ForbiddenError = function(msg) {
  AbstractError.call(this, msg);
};
util.inherits(ForbiddenError, AbstractError);
ForbiddenError.prototype.name = 'Forbidden Error';

/* =========================================================================
 * Invalid Argument Error
 * ========================================================================= */
var InvalidArgumentError = function(msg) {
  AbstractError.call(this, msg);
};
util.inherits(InvalidArgumentError, AbstractError);
InvalidArgumentError.prototype.name = 'Invalid Argument Error';

/* =========================================================================
 * Validation Error
 * ========================================================================= */
var ValidationError = function(msg) {
  AbstractError.call(this, msg);
}
util.inherits(ValidationError, AbstractError);
ValidationError.prototype.name = 'Data validation Error';

/**
 * Handle mongoose error codes and throw proper error
 * @param  {MongoError} err mongoose error
 * @return {Error}     [description]
 */
var handleDbError = function(err) {
  switch (err.code) {
    // duplicate key
    case 11000:
      return new DuplicateKeyError(err.err);
      break;
    default:
      return new DatabaseError(err);
      break;
  }
};

/**
 * Handle mongoose error codes and throw proper error
 * @param  {ValidationError} err mongoose validation error
 * @return {Array}     array of ValidationErrors
 */
var handleMongooseValidationError = function(err) {
  var messages = {
    'required': "%s is required.",
    'min': "%s below minimum.",
    'max': "%s above maximum.",
    'enum': "%s not an allowed value.",
  };

  // A validationerror can contain more than one error.
  var errors = [];

  //Loop over the errors object of the Validation Error
  Object.keys(err.errors).forEach(function(field) {
    var eObj = err.errors[field];

    if (eObj.type === 'user defined') {
      errors.push(new ValidationError(eObj.message));
    } else {
      //If we don't have a message for `type`, just push the error through
      if (!messages.hasOwnProperty(eObj.type)) errors.push(eObj.type);

      //Otherwise, use util.format to format the message, and passing the path
      else errors.push(new ValidationError(require('util').format(messages[eObj.type], eObj.path)));
    }
  });

  return errors;
};

/**
 * Export errors to be used
 * @type {Object}
 */
module.exports = {
  // HTTP errors
  UnauthorizedError: UnauthorizedError,
  ForbiddenError: ForbiddenError,
  ObjectNotFoundError: ObjectNotFoundError,

  // Application errors
  DatabaseError: DatabaseError,
  NotImplementedError: NotImplementedError,
  InvalidArgumentError: InvalidArgumentError,
  ValidationError: ValidationError,

  // Error Handlers
  handleDbError: handleDbError,
  handleMongooseValidationError: handleMongooseValidationError,

  AbstractError: AbstractError
};
