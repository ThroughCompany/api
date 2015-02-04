"use strict";

// module dependencies ======================================================================
var userApiController = require('../controllers/userApiController');
var lookupDataApiController = require('../controllers/lookupDataApiController');
var authApiController = require('../controllers/authApiController');
var appStatusController = require('../controllers/appStatusController');
var authMiddleware = require('../middleware/authMiddleware');


module.exports.register = function(app) {
  //api info
  app.get('/', function(req, res) {
    res.send(200, {
      api: 'Company Floor API',
      version: CompanyFloor.config.apiVersion
    });
  });
  app.get('/ping', appStatusController.ping);

  //user
  app.post('/users',
    userApiController.createUser);

  app.get('/users',
    userApiController.getUsers); //TODO: NEED TO PROTECT WITH ADMIN LEVEL PERMISSIONS

  app.get('/users/:id',
    authMiddleware.authenticationRequired,
    authMiddleware.currentUserIdParamRequired(),
    userApiController.getUserById);

  app.patch('/users/:id',
    authMiddleware.authenticationRequired,
    authMiddleware.currentUserIdParamRequired(),
    userApiController.updateUserById);

  // app.get('/users/:id/profilepic',
  //     authMiddleware.authenticationRequired,
  //     authMiddleware.currentUserIdParamRequired(),
  //     userApiController.getUserProfilePicById);

  // app.post('/users/:id/profilepic',
  //     authMiddleware.authenticationRequired,
  //     authMiddleware.currentUserIdParamRequired(),
  //     userApiController.createUserProfilePic);


  //user companies
  app.get('/users/:id/companies',
    authMiddleware.authenticationRequired,
    authMiddleware.currentUserIdParamRequired(),
    userApiController.getUserCompanies);

  app.post('/users/:id/companies',
    authMiddleware.authenticationRequired,
    authMiddleware.currentUserIdParamRequired(),
    userApiController.createUserCompany);

  app.get('/users/:id/companies/:companyId',
    authMiddleware.authenticationRequired,
    authMiddleware.currentUserIdParamRequired(),
    authMiddleware.currentCompanyIdParamRequired('companyId'),
    userApiController.getUserCompanyById);

  app.patch('/users/:id/companies/:companyId',
    authMiddleware.authenticationRequired,
    authMiddleware.currentUserIdParamRequired(),
    authMiddleware.currentCompanyIdParamRequired('companyId'),
    userApiController.updateUserCompanyById);

  app.get('/users/:id/companies/:companyId/users',
    authMiddleware.authenticationRequired,
    authMiddleware.currentUserIdParamRequired(),
    authMiddleware.currentCompanyIdParamRequired('companyId'),
    authMiddleware.currentCompanyClaimRequiredBody('View-Company-Users', 'companyId'),
    userApiController.getUserCompanyUsers);

  app.post('/users/:id/companies/:companyId/users',
    authMiddleware.authenticationRequired,
    authMiddleware.currentUserIdParamRequired(),
    authMiddleware.currentCompanyIdParamRequired('companyId'),
    authMiddleware.currentCompanyClaimRequiredBody('Add-Company-Users', 'companyId'),
    userApiController.addUserCompanyUsers);

  //authentication + authorization
  app.get('/users/:id/claims',
    authMiddleware.authenticationRequired,
    authMiddleware.currentUserIdParamRequired(),
    userApiController.getUserClaimsBydId);

  //lookup data
  app.get('/companyTypes',
    authMiddleware.authenticationRequired,
    lookupDataApiController.getCompanyTypes);

  app.get('/states',
    authMiddleware.authenticationRequired,
    lookupDataApiController.getStates);
};
