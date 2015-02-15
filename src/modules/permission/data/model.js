"use strict";

/* =========================================================================
 * Dependencies
 * ========================================================================= */
var mongoose = require('mongoose');
var permissionSchema = require('./permission-schema');

/* =========================================================================
 * Exports
 * ========================================================================= */
module.exports = mongoose.model('Permission', permissionSchema);
