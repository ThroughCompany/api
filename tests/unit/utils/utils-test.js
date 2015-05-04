/* =========================================================================
 * Dependencies
 * ========================================================================= */
require('tests/unit/before-all');

var should = require('should');
var _ = require('underscore');

var utils = require('utils/utils');

/* =========================================================================
 * Before All
 * ========================================================================= */

describe('utils', function() {
  describe('utils', function() {
    describe('arraysAreEqual()', function() {
      describe('when comparing arrays of numbers that are not equal', function() {
        it('should return false', function(done) {
          var array1 = [1, 2, 3, 4, 5];
          var array2 = [6, 7, 8, 9, 10];

          var areEqual = utils.arraysAreEqual(array1, array2);

          areEqual.should.equal(false);

          done();
        });
      });

      describe('when comparing arrays of numbers that are equal', function() {
        it('should return true', function(done) {
          var array1 = [1, 2, 3, 4, 5];
          var array2 = [1, 2, 3, 4, 5];

          var areEqual = utils.arraysAreEqual(array1, array2);

          areEqual.should.equal(true);

          done();
        });
      });

      describe('when comparing arrays of strings that are not equal', function() {
        it('should return false', function(done) {
          var array1 = ['1', '2', '3', '4', '5'];
          var array2 = ['6', '7', '8', '9', '10'];

          var areEqual = utils.arraysAreEqual(array1, array2);

          areEqual.should.equal(false);

          done();
        });
      });

      describe('when comparing arrays of strings that are equal', function() {
        it('should return true', function(done) {
          var array1 = ['1', '2', '3', '4', '5'];
          var array2 = ['1', '2', '3', '4', '5'];

          var areEqual = utils.arraysAreEqual(array1, array2);

          areEqual.should.equal(true);

          done();
        });
      });
    });

    describe('arrayClean', function() {
      describe('when array contains null and undefined values', function() {
        it('should remove them', function(done) {
          var array1 = [null, '1', undefined, '2'];

          var cleanedArray = utils.arrayClean(array1);

          _.each(cleanedArray, function(arrayValue) {
            arrayValue.should.not.equal(null);
            arrayValue.should.not.equal(undefined);
          });

          cleanedArray.length.should.equal(2);

          done();
        });
      });
    });
  });
});
