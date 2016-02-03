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

var simple1 = acorn.parse(`1 + 2`);
var simple2 = acorn.parse(`1 + 3`);
var simple3 = acorn.parse(`1 - 2`);

var simple1WithSpace = acorn.parse(` 1 +   2`);

var function1 = acorn.parse(`1 + 2; function foo(){ return 1; }`);
var function2 = acorn.parse(`1 + 2; function foo(){ return 2; }`);

describe('ast diff', function(){
  it('identifies different asts', function(){
    assert.isFalse(jsastdiff.diff(simple1, simple1));
    assert.isTrue(jsastdiff.diff(simple1, simple2));
    assert.isTrue(jsastdiff.diff(simple1, simple3));
  });
  it('ignores whitespace changes', function(){
    assert.isFalse(jsastdiff.diff(simple1, simple1));
    assert.isFalse(jsastdiff.diff(simple1, simple1WithSpace));
  });
  it('ignores function bodies', function(){
    assert.isFalse(jsastdiff.diff(function1, function1));
    assert.isFalse(jsastdiff.diff(function1, function2));
  });
});

describe('changed function names', function(){

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
