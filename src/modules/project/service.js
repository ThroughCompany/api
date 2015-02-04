"use strict";

/* =========================================================================
 *
 *   Dependencies
 *
 * ========================================================================= */
var util = require('util');
var _ = require('underscore');
var async = require('async');
var uuid = require('node-uuid');
var regexes = require('../constants/regexes');
var mongoose = require('mongoose');

//service
var authService = require('modules/auth');
var commonService = require('modules/common');
var error = require('modules/error');

//models
var User = require('modules/user/model');

var projectService = function() {
  commonService.call(this, Company);
};
util.inherits(projectService, commonService);

/**
 * @param {object} options
 * @param {string} companyType
 * @param {number} createdBydUserId
 * @param {string} dateOfIncorporation
 * @param {string} stateOfIncorporation
 * @param {string} authorizedSharesCommonStock
 * @param {number} parValueCommonStock
 * @param {array} preferredStock
 * @param {function} next - callback
 */
projectService.prototype.create = function(options, next) {
  if (!options.name) return next(new error.InvalidArgumentError('Name is required'));
  if (!options.companyType) return next(new error.InvalidArgumentError('Company Type is required'));
  if (!options.createdByUserId) return next(new error.InvalidArgumentError('Created By User Id is required'));

  if (options.stateOfIncorporation && !_.contains(lookupData.states, options.stateOfIncorporation)) return next(new error.InvalidArgumentError(options.stateOfIncorporation + ' is not a valid US state'));
  if (options.dateOfIncorporation && !regexes.date.test(options.dateOfIncorporation)) return next(new error.InvalidArgumentError(options.dateOfIncorporation + ' is not a valid date'));

  if (options.preferredStock && options.preferredStock.length) {
    _.each(options.preferredStock, function(preferredStock) {
      if (!preferredStock.name) return next(new error.InvalidArgumentError('Preferred Stock Name is required'));
      if (!preferredStock.amount) return next(new error.InvalidArgumentError('Preferred Stock Amount is required'));
    });
  }

  var self = this;

  var foundCompanyType = null;

  async.waterfall([

    function findCompanyType(callback) {
      lookupEntityManager.getCompanyTypes({}, callback);
    },
    function findUserByEmail(companyTypes, callback) {
      foundCompanyType = _.find(companyTypes, function(compType) {
        return compType.type.toLowerCase() === options.companyType.toLowerCase();
      });

      if (!foundCompanyType) return callback(new error.InvalidArgumentError(options.companyType + ' is not a valid company type'));

      userEntityManager.getById({
        userId: options.createdByUserId
      }, callback);
    },
    function createCompany(user, callback) {
      if (!user) return callback(new error.InvalidArgumentError('No user with the email ' + options.createdByUserId + ' exists'));

      if (foundCompanyType.type === 'C-Corporation') {
        var company = new CCorporation();
        company.name = options.name;
        company.createdBy = user._id;
        company.icon = foundCompanyType.icon;
        company.dateOfIncorporation = options.dateOfIncorporation;
        company.stateOfIncorporation = options.stateOfIncorporation;
        company.authorizedSharesCommonStock = options.authorizedSharesCommonStock;
        company.parValueCommonStock = options.parValueCommonStock;
        company.preferredStock = options.preferredStock;
        company.companyUsers.push(user);

        company.save(function(err, company) {
          callback(err, company, user);
        });
      } else {
        CompanyFloor.logger.error('Company Type data has not been loaded into database');
        return callback(new error.InternalServiceError('No Company Type \'' + options.companyType + '\' exists'));
      }
    },
    function getCompanyAdminRole(company, user, callback) {
      Role.findOne({
        name: 'Company-Admin'
      }, function(err, role) {
        if (err || !role) {
          CompanyFloor.logger.error('Role data has not been loaded into database');
          return callback(new error.InternalServiceError('No Role with name Company-Admin exists'));
        }

        role.populate('permissions', function(err, role) {
          callback(err, role, company, user);
        });
      });
    },
    function createNewCompanyUser(role, company, user, callback) {
      var companyUser = {
        permissions: []
      };
      companyUser.company = company;
      role.permissions.forEach(function(permission) {
        companyUser.permissions.push(permission);
      });

      user.companyUsers.push(companyUser); //add a ref to the user to the company being created, plus permissions, etc...

      user.save(function(err, user) {
        callback(err, company);
      });
    }
  ], function finish(err, newCompany) {
    return next(err, newCompany);
  });
};

/**
 * @param {object} options
 * @param {string} companyId
 * @param {array} populate
 * @param {function} next - callback
 */
projectService.prototype.getById = function(options, next) {
  if (!options.companyId) return next(new error.InvalidArgumentError('Company Id is required'));

  var query = Company.findOne({
    _id: options.companyId
  });

  if (options.populate && _.isArray(options.populate)) Company.addPopulateToQuery(query, options.populate);

  return query.exec(next);
};

/**
 * @param {object} options
 * @param {string} companyId
 * @param {function} next - callback
 */
projectService.prototype.delete = function(options, next) {
  if (!options.companyId) return next(new error.InvalidArgumentError('Company Id is required'));

  Company.findOneAndRemove({
    _id: options.companyId
  }, next);
};

/**
 * @param {object} options
 * @param {string} companyId
 * @param {object} updates
 * @param {function} next - callback
 */
projectService.prototype.update = function(options, next) {
  if (!options.companyId) return next(new error.InvalidArgumentError('Company Id is required'));
  if (!options.updates) return next(new error.InvalidArgumentError('Updates is required'));

  var self = this;

  async.waterfall([

    function findCompanyById(callback) {
      self.getById({
        companyId: options.companyId
      }, callback);
    },
    function updateCompany(company, callback) {
      if (!company) return callback(new error.InvalidArgumentError('no company exists with the id ' + options.companyId));

      company.update(options.updates, callback);
    }
  ], function finish(err, results) {
    return next(err, results);
  });
};

/**
 * @param {object} options
 * @param {string} userId
 * @param {function} next - callback
 */
projectService.prototype.getCompaniesForUser = function(options, next) {
  if (!options.userId) return next(new error.InvalidArgumentError('User Id is required'));

  var self = this;

  var query = Company.find({
    companyUsers: options.userId
  });

  //query.elemMatch('companyUsers', options.userId);

  return query.exec(next);
};

/**
 * @param {object} options
 * @param {string} companyId
 * @param {string} userId
 * @param {function} next - callback
 */
projectService.prototype.getCompanyForUser = function(options, next) {
  if (!options.companyId) return next(new error.InvalidArgumentError('Company Id is required'));
  if (!options.userId) return next(new error.InvalidArgumentError('User Id is required'));

  var self = this;

  var query = Company.findOne({
    _id: options.companyId,
    companyUsers: options.userId
  });

  return query.exec(next);
};

/**
 * @param {object} options
 * @param {string} companyId
 * @param {string} invitedByUserId
 * @param {string} email
 * @param {string} emailConfirmation
 * @param {function} next - callback
 */
projectService.prototype.addCompanyUser = function(options, next) {
  if (!options.companyId) return next(new error.InvalidArgumentError('Company Id is required'));
  if (!options.invitedByUserId) return next(new error.InvalidArgumentError('Invited By User Id is required'));
  if (!options.email) return next(new error.InvalidArgumentError('Email is required'));
  if (!options.emailConfirmation) return next(new error.InvalidArgumentError('Email Confirmation is required'));

  var self = this;

  var emailRegex = regexes.email;
  if (!emailRegex.test(options.email)) return next(new error.InvalidArgumentError(options.email + ' is not a valid email address'));
  if (options.email !== options.emailConfirmation) return next(new error.InvalidArgumentError('Email addresses do not match'));

  async.waterfall([

      function findCompany(callback) {
        self.getById({
          companyId: options.companyId,
          populate: ['companyUsers']
        }, callback);
      },
      function findCompanyUser(company, callback) {
        if (!company) return callback(new error.InvalidArgumentError('No company exists with the Id ' + options.companyId));

        var companyUser = _.find(company.users, function(user) {
          return user._id === options.invitedByUserId;
        });

        return callback(null, companyUser, company);
      },
      function tryAndFindExisitingUserByEmail(adminCompanyUser, company, callback) {
        userEntityManager.getByEmail({
          email: options.email
        }, function(err, existingUser) {
          return callback(err, adminCompanyUser, company, existingUser);
        });
      },
      function getOrCreateNewUser(adminCompanyUser, company, existingUser, callback) {
        var newUserCreated = false;

        //either create a new user, or add an existing user
        if (!existingUser) {
          var temporaryPassword = uuid.v4().substring(0, 10);
          newUserCreated = true;

          userEntityManager.createUsingCredentials({
            email: options.email,
            emailConfirmation: options.emailConfirmation,
            password: temporaryPassword
          }, function(err, newUser) {
            return callback(err, adminCompanyUser, company, newUser, newUserCreated, temporaryPassword);
          });
        } else {
          return callback(null, adminCompanyUser, company, existingUser, newUserCreated, null);
        }
      },
      function addUserToCompany(adminCompanyUser, company, newCompanyUser, newUserCreated, temporaryPassword, callback) {
        var existingCompanyUser = _.find(company.companyUsers, function(companyUser) {
          return companyUser._id === newCompanyUser._id;
        });

        if (existingCompanyUser) return callback(new error.InvalidArgumentError('User ' + newCompanyUser._id + ' already exists in this company.'));

        Company.update({
          _id: company._id
        }, {
          $push: {
            companyUsers: newCompanyUser
          }
        }, function(err) {
          return callback(err, adminCompanyUser, company, newCompanyUser, newUserCreated, temporaryPassword);
        });


        // self.update({
        //   companyId: company._id,
        //   updates: {
        //     $push: {
        //       companyUsers: newCompanyUser
        //     }
        //   }
        // }, function(err) {
        //   return callback(err, adminCompanyUser, company, newCompanyUser, newUserCreated, temporaryPassword);
        // });

      },
      function updateUserWithNewCompany(adminCompanyUser, company, newCompanyUser, newUserCreated, temporaryPassword, callback) {
        var companyUser = new CompanyUser();
        companyUser.company = company;
        companyUser.permissions = [];

        newCompanyUser.companyUsers.push(companyUser);

        newCompanyUser.save(function(err, user) {
          return callback(err, newCompanyUser, newUserCreated, temporaryPassword);
        });
      }
    ],
    function finish(err, newCompanyUser, newUserCreated, temporaryPassword) {
      return next(err, newCompanyUser, newUserCreated, temporaryPassword);
    });
};

// public api ===============================================================================
module.exports = new projectService();
