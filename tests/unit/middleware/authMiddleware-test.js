/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/unit/before-all');

var should = require('should');
var sinon = require('sinon');
var _ = require('underscore');

//modules
var authService = require('modules/auth');

//middleware
var authMiddleware = require('src/middleware/authMiddleware');

var utils = require('utils/utils');

var sandbox;

/* =========================================================================
 * Before All
 * ========================================================================= */
before(function(done) {
  sandbox = sinon.sandbox.create();

  done();
});

describe('middleware', function() {
  describe('authMiddlware', function() {
    describe('authenticationRequired', function() {
      afterEach(function(next) {
        sandbox.restore();

        next();
      });

      describe('when auth token is not in query string, body, or header', function() {
        it('should return an error', function(done) {
          var req = {
            headers: []
          };
          var res = {};

          authMiddleware.authenticationRequired(req, res, function(err) {
            should.exist(err);
            err.message.should.equal('Access token required');

            done();
          });
        });
      });

      describe('when auth token is in query string', function() {
        var accessToken = '12345';
        var authenticationTokenStub;

        before(function(done) {
          authenticationTokenStub = sandbox.stub(authService, 'authenticateToken');
          authenticationTokenStub.yields(null, {});

          done();
        });

        it('should call authService.authenticateToken() with the token', function(done) {
          var req = {
            query: {
              access_token: accessToken
            },
            headers: []
          };
          var res = {};

          authMiddleware.authenticationRequired(req, res, function(err) {
            should.not.exist(err);

            authenticationTokenStub.called.should.equal(true);

            authenticationTokenStub.calledWith({
              token: accessToken
            }).should.equal(true);

            done();
          });
        });
      });

      describe('when auth token is in body', function() {
        var accessToken = '12345';
        var authenticationTokenStub;

        before(function(done) {
          authenticationTokenStub = sandbox.stub(authService, 'authenticateToken');
          authenticationTokenStub.yields(null, {});

          done();
        });

        it('should call authService.authenticateToken() with the token', function(done) {
          var req = {
            body: {
              access_token: accessToken
            },
            headers: []
          };
          var res = {};

          authMiddleware.authenticationRequired(req, res, function(err) {
            should.not.exist(err);

            authenticationTokenStub.called.should.equal(true);

            authenticationTokenStub.calledWith({
              token: accessToken
            }).should.equal(true);

            done();
          });
        });
      });

      describe('when auth token is in header', function() {
        var accessToken = '12345';
        var authenticationTokenStub;

        before(function(done) {
          authenticationTokenStub = sandbox.stub(authService, 'authenticateToken');
          authenticationTokenStub.yields(null, {});

          done();
        });

        it('should call authService.authenticateToken() with the token', function(done) {
          var headers = [];
          headers['x-access-token'] = accessToken;

          var req = {
            headers: headers
          };
          var res = {};

          authMiddleware.authenticationRequired(req, res, function(err) {
            should.not.exist(err);

            authenticationTokenStub.called.should.equal(true);

            authenticationTokenStub.calledWith({
              token: accessToken
            }).should.equal(true);

            done();
          });
        });
      });
    });

    describe('currentUserIdQueryParamRequired', function() {
      describe('when param is not in params', function() {
        it('should return an error', function(done) {
          var params = [];

          var req = {
            params: params,
            claims: {}
          };
          var res = {};

          var middleware = authMiddleware.currentUserIdQueryParamRequired();

          middleware(req, res, function(err) {
            should.exist(err);

            err.message.should.equal('Current user id does not match user id param');

            done();
          });
        });
      });

      describe('when user has admin claim', function() {
        it('should not return an error', function(done) {
          var params = [];

          var req = {
            params: params,
            claims: {
              admin: true
            }
          };
          var res = {};

          var middleware = authMiddleware.currentUserIdQueryParamRequired();

          middleware(req, res, function(err) {
            should.not.exist(err);

            done();
          });
        });
      });

      describe('when userId param matches userId claim', function() {
        it('should not return an error', function(done) {
          var userId = '12345';

          var params = [];
          params['id'] = userId;

          var req = {
            params: params,
            claims: {
              userId: userId
            }
          };
          var res = {};

          var middleware = authMiddleware.currentUserIdQueryParamRequired();

          middleware(req, res, function(err) {
            should.not.exist(err);

            done();
          });
        });
      });
    });

    describe('currentUserIdBodyParamRequired', function() {
      describe('when param is not in body', function() {
        it('should return an error', function(done) {
          var body = [];

          var req = {
            body: body,
            claims: {}
          };
          var res = {};

          var middleware = authMiddleware.currentUserIdBodyParamRequired();

          middleware(req, res, function(err) {
            should.exist(err);

            err.message.should.equal('Current user id does not match user id body param');

            done();
          });
        });
      });

      describe('when user has admin claim', function() {
        it('should not return an error', function(done) {
          var body = [];

          var req = {
            body: body,
            claims: {
              admin: true
            }
          };
          var res = {};

          var middleware = authMiddleware.currentUserIdBodyParamRequired();

          middleware(req, res, function(err) {
            should.not.exist(err);

            done();
          });
        });
      });

      describe('when userId param matches userId claim', function() {
        it('should not return an error', function(done) {
          var userId = '12345';

          var body = [];
          body['id'] = userId;

          var req = {
            body: body,
            claims: {
              userId: userId
            }
          };
          var res = {};

          var middleware = authMiddleware.currentUserIdBodyParamRequired();

          middleware(req, res, function(err) {
            should.not.exist(err);

            done();
          });
        });
      });
    });
  });
});
