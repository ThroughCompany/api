/* =========================================================================
 * Dependencies
 * ========================================================================= */
var async = require('async');

//services
var authService = require('modules/auth');
var userService = require('modules/user');

/* =========================================================================
 * Controller
 * ========================================================================= */
function Controller() {}

/** 
 * @description Get all users
 */
Controller.prototype.getUsers = function(req, res, next) {
  userService.getAll({}, function(err, users) {
    if (err) return next(err);
    return res.status(200).json(users);
  });
};

/** 
 * @description Create a new user
 */
Controller.prototype.createUser = function(req, res, next) {

  //form data
  var email = req.body.email;
  var password = req.body.password;

  async.waterfall([
    function createNewUser(callback) {
      userService.createUsingCredentials({
        email: email,
        password: password
      }, callback);
    }
  ], function finish(err, newUser) {
    if (err) return next(err);
    else return res.status(201).json(newUser);
  });
};

/** 
 * @description Get user by id
 */
Controller.prototype.getUserById = function(req, res, next) {
  var userId = req.params.id;

  userService.getById({
    userId: userId
  }, function(err, user) {
    if (err) return next(err);
    else if (!user) return res.json(404);
    else res.status(200).json(user);
  });
};

/** 
 * @description Update user
 */
Controller.prototype.updateUserById = function(req, res, next) {
  var userId = req.params.id;
  var updates = req.body;

  userEntityManager.update({
    userId: userId,
    updates: updates
  }, function(err, user) {
    if (err) return next(err);
    else if (!user) return res.json(404);
    else return res.json(200, user);
  });
};

/** 
 * @description Get a user's authorization claims
 */
Controller.prototype.getUserClaimsBydId = function(req, res, next) {
  var userId = req.params.id;
  var populate = ['companyUsers.permissions'];

  async.waterfall([
    function getUser(callback) {
      userService.getById({
        userId: userId,
        populate: populate
      }, callback);
    },
    function getUserClaims(user, callback) {
      authService.getUserClaims(user, callback);
    }
  ], function finish(err, claims) {
    if (err) return next(err);
    else if (!claims) return res.json(404);
    else return res.json(200, claims);
  });
};

Controller.prototype.getUserProfilePicById = function(req, res, next) {
  var userId = req.params.id;

  throw new Error('Not Implemented');
};

Controller.prototype.createUserProfilePic = function(req, res, next) {
  var userId = req.params.id;

  throw new Error('Not Implemented');
};

// user company
Controller.prototype.getUserCompanyById = function(req, res, next) {
  var userId = req.params.id;
  var companyId = req.params.companyId;

  companyEntityManager.getCompanyForUser({
    companyId: companyId,
    userId: userId
  }, function(err, company) {

    if (err) return next(err);
    else if (!company) return res.json(404);
    else return res.json(200, company);
  });
};

Controller.prototype.getUserCompanies = function(req, res, next) {
  var userId = req.params.id;

  companyEntityManager.getCompaniesForUser({
    userId: userId
  }, function(err, companies) {
    if (err) return next(err);
    else return res.json(200, companies);
  });
};

Controller.createUserCompany = function(req, res, next) {
  var name = req.body.name;
  var type = req.body.type;
  var createdByUserId = req.user._id;
  var dateOfIncorporation = req.body.dateOfIncorporation;
  var stateOfIncorporation = req.body.stateOfIncorporation;
  var authorizedSharesCommonStock = req.body.authorizedSharesCommonStock;
  var parValueCommonStock = req.body.parValueCommonStock;
  var preferredStock = req.body.preferredStock;

  companyEntityManager.create({
    name: name,
    companyType: type,
    createdByUserId: createdByUserId,
    dateOfIncorporation: dateOfIncorporation,
    stateOfIncorporation: stateOfIncorporation,
    authorizedSharesCommonStock: authorizedSharesCommonStock,
    parValueCommonStock: parValueCommonStock,
    preferredStock: preferredStock
  }, function(err, company) {
    if (err) return next(err);
    return res.json(201, company);
  });
};

Controller.prototype.updateUserCompanyById = function(req, res, next) { //TODO: move to companyEntityManager
  var companyId = req.params.companyId;
  var updates = req.body;

  companyEntityManager.update({
    companyId: companyId,
    updates: updates
  }, function(err, company) {
    if (err) return next(err);
    else return res.json(200, company);
  });
};

Controller.prototype.getUserCompanyUsers = function(req, res, next) {

  var findOptions = {
    companyUsers: {
      $elemMatch: {
        company: req.params.companyId
      }
    }
  };

  userEntityManager.getAll({
    findOptions: findOptions
  }, function(err, companies) {
    if (err) return next(err);
    else return res.json(200, companies);
  });
};

Controller.prototype.addUserCompanyUsers = function(req, res, next) {

  var invitedByUserId = req.user._id;
  var companyId = req.params.companyId;
  var email = req.body.email;
  var emailConfirmation = req.body.emailConfirmation;

  async.waterfall([

    function addCompanyUser(callback) {
      companyEntityManager.addCompanyUser({
        companyId: companyId,
        invitedByUserId: invitedByUserId,
        email: email,
        emailConfirmation: emailConfirmation
      }, callback);
    }
  ], function finish(err, newUser) {
    if (err) return next(err);
    else return res.json(200, newUser);
  });
};

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = new Controller();
