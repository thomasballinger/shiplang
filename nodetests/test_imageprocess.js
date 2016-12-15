/// <reference path="../typings/mocha/mocha.d.ts" />
var assert = require('chai').assert;

var imageprocess = require('../nodesrc/imageprocess');

describe('findOutline', () => {
  it("works", (done) => {
    function cb(result){
      done();
    }
    imageprocess.findOutline('./esimages/ship/aerie.png', cb);
  });
});
/*
describe('RDP', () => {
  it('makes complex paths simpler', () => {
    var path = [[0, 0], [10, 0], [20, 1]];
    var result = imageprocess.RDP(path);
    assert.deepEqual(result, [[0, 0], [20, 1]]);
  });
  it('helpers work', () => {
    assert.equal(imageprocess.distFromLine([0, 0], [0, 10], [5, 5]), 5);
  });
});
*/
