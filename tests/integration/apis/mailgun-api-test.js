/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/integration/before-all');

var should = require('should');
var async = require('async');
var _ = require('underscore');

var app = require('src');
var appConfig = require('src/config/app-config');

var testUtils = require('tests/lib/test-utils');

var mailGunApi = require('lib/mailgun-api');

var agent;

/* =========================================================================
 * Constants
 * ========================================================================= */
var TEST_EMAIL = 'test@mailinator.com';

/* =========================================================================
 * Before All
 * ========================================================================= */

before(function(done) {
  agent = require('tests/lib/agent').getAgent();

  done();
});

describe('apis', function() {
  describe('mailgun', function() {
    describe('sendEmail', function() {
      describe('when given plain text', function() {
        it('should send a plain text email', function(done) {
          mailGunApi.sendEmail({
            to: TEST_EMAIL,
            from: TEST_EMAIL,
            subject: 'Testing',
            text: 'Hello There. This is a test email.'
          }, function(err, result) {
            should.not.exist(err);
            should.exist(result);

            result.message.should.equal('Queued. Thank you.');

            done();
          });
        });
      });

      describe('when given html', function() {
        it('should send a plain text email', function(done) {
          mailGunApi.sendEmail({
            to: TEST_EMAIL,
            from: TEST_EMAIL,
            subject: 'Testing',
            html: '<h1>Hello There.</h1><p>This is a test email</p>'
          }, function(err, result) {
            should.not.exist(err);
            should.exist(result);

            result.message.should.equal('Queued. Thank you.');

            done();
          });
        });
      });
    });
  });
});
