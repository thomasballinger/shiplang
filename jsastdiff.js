var acorn = require('acorn');
acorn.walk = require('acorn/dist/walk');



//TODO translate dalsegno function diff algorithms to JavaScript diffing acorn ASTs.


function findNamedFunctions(ast){
  var nodes = [];
  acorn.walk.simple(ast, {'FunctionDeclaration':function(x){ nodes.push(x); }});
  console.log(nodes.map(function(x){ return x; }));
  return nodes;
}

function functionBodiesDifferent(f1, f2){
  return  (JSON.stringify(this.body) !== JSON.stringify(other.body) ||
           JSON.stringify(this.params) !== JSON.stringify(other.params));
}

function changedNamedFunctions(){
  return {};
}

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

  findNamedFunctions(ast1);
}

test();
exports.changedNamedFunctions = changedNamedFunctions;
