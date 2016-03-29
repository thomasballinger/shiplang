/// <reference path="../typings/mocha/mocha.d.ts" />
var assert = require('chai').assert;

var imageprocess = require('../imageprocess');

describe('findOutline', () => {
  it("works", (done) => {
    function cb(result){
      done();
    }
    var outline = imageprocess.findOutline('./esimages/ship/aerie.png', cb);
    console.log(outline);
    assert.equal(1, 1);
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
