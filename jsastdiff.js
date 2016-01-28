var acorn = require('acorn');
acorn.walk = require('acorn/dist/walk');

//TODO translate dalsegno function diff algorithms to JavaScript diffing acorn ASTs.

console.log(acorn.walk);



function test(){

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

changed = astdiff(ast1, ast2);
console.log(change.foo !== undefined);
console.log(change.bar === undefined);
console.log(change.baz === undefined);

changed = astdiff(ast1, ast3);
console.log(change.foo !== undefined);
console.log(change.bar === undefined);
console.log(change.baz === undefined);
}

test();
