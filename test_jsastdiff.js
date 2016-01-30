'use strict';
var chai = require('chai');
var assert = chai.assert;

var jsastdiff = require('./jsastdiff');
var acorn = require('acorn');

var ast1 = acorn.parse(`
  var z = 1;
  function foo(a, b){
    var g = 19;
    function bar(c, e){
      var f = 4;
      function baz(h){
        23;
      }
    }
    var i = function(u){
      123
    }
  } `);

var ast2 = acorn.parse(`
  var z = 1;
  function foo(a, b){
    var g = 20;
    function bar(c, e){
      var f = 4;
      function baz(h){
        23;
      }
    }
    var i = function(u){
      123
    }
  } `);

var ast3 = acorn.parse(`
  var z = 1;
  function foo(a, b){
    var g = 19;
    function bar(c, e, asdf){
      var f = 4;
      function baz(h){
        23;
      }
    }
    var i = function(u){
      123
    }
  } `);

describe('ast diff', function(){

  it('returns only functions whose bodies have changed', function(){
    var changed = jsastdiff.changedNamedFunctions(ast1, ast2);
    assert.notEqual(changed.foo, undefined);
    assert.equal(changed.bar, undefined);
    assert.equal(changed.baz, undefined);

    changed = jsastdiff.changedNamedFunctions(ast1, ast3);
    assert.notEqual(changed.foo, undefined);
    assert.equal(changed.bar, undefined);
    assert.equal(changed.baz, undefined);
  });
});
