/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/unit/before-all');

var should = require('should');

var templateService = require('lib/services/templateService');

/* =========================================================================
 * Before All
 * ========================================================================= */

describe('lib', function() {
  describe('services', function() {
    describe('templateService', function() {
      it('should return a compiled template', function(done) {
        var templatePath = __dirname + '/template1.html';
        var data = {
          name: 'This is an awesome template',
          description: 'Yes it is'
        };

        templateService.generate({
          templateFilePath: templatePath,
          templateData: data
        }, function(err, result) {
          if (err) return done(err);

          should.exist(result);
          result.should.equal('<div>' + 
            '\n  <h1>This is an awesome template</h1>' + 
            '\n  <p>Yes it is</p>' +
            '\n</div>\n');

          done();
        });
      });
    });
  });
});
