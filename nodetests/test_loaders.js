var assert = require('chai').assert;


var spriteLoader = require('../sprite-loader');
var spriteOutlineLoader = require('../sprite-loader');
var spriteOutlineloader = require('../sprite-outline-loader');
var spriteSizeLoaer = require('../sprite-size-loader');
var spriteSrcLoader = require('../sprite-src-loader');

describe('loaders', () => {
  it("load", () => {
    assert.isOk(true, 'all loaders loaded');
  });
});
