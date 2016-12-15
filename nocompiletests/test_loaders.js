/// <reference path="../typings/mocha/mocha.d.ts" />
var assert = require('chai').assert;

// This test cannot be compiled by webpack because it
// uses node-ts to dynamically require src/dataload.ts
var dataLoader = require('../data-loader');

describe('loaders', () => {
  it("load", () => {
    assert.isOk(true, 'data-loader loaded');
  });
});
