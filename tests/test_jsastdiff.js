'use strict';
var chai = require('chai');
var assert = chai.assert;

var jsastdiff = require('./src/jsastdiff');
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
});
describe('ast diff ignoring function declarations', function(){
  it('ignores function bodies', function(){
    assert.isFalse(jsastdiff.diffIgnoringFunctionDeclarations(function1, function1));
    assert.isFalse(jsastdiff.diffIgnoringFunctionDeclarations(function1, function2));
  });
});

describe('changed function names', function(){
  it('returns only functions whose bodies have changed', function(){
    var changed = jsastdiff.changedNamedFunctions(ast1, ast2);
    assert.notEqual(changed.foo, undefined);
    assert.equal(changed.bar, undefined);
    assert.equal(changed.baz, undefined);
  });

    // TODO currently changing parameters makes the outer function
    // different because only function bodies are swapped in. Eventually
    // it might be nice if parameters were swapped in too, so they
    // could trigger diff of the function they belong to instead of the
    // outer one.
  it('counts changes in parameters as changes to the containing function', function(){
    var changed = jsastdiff.changedNamedFunctions(ast1, ast3);
    assert.notEqual(changed.foo, undefined);
    assert.equal(changed.bar, undefined);
    assert.equal(changed.baz, undefined);
  });
  it('changes to inner function do not trigger full reset', function(){
    var s1 = `
function comeBackIfOutOfBounds(){
    thrustFor(1);
}

function greet(){
  1 + 1;
}

while (true){
    comeBackIfOutOfBounds()
    leftFor(1)
}
    `;
    var s2 = `
function comeBackIfOutOfBounds(){
    thrustFor(1);
}

function greet(){
  1 + 12;
}

while (true){
    comeBackIfOutOfBounds()
    leftFor(1)
}
    `;
    var changed = jsastdiff.changedNamedFunctions(acorn.parse(s1), acorn.parse(s2));
    assert.equal(changed['*main*'], undefined);
    assert.notEqual(changed['greet'], undefined);
  });
});

