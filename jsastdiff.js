var acorn = require('acorn');
acorn.walk = require('acorn/dist/walk');


//
// Main goal: find what functions have been modified between two asts.
// This will run each keystroke or other edit operation.
// If a function's name has changed, the function containing it
// has changed. If a function's name has changed, that's a change
// to the outer function.
//
// Also needs to report if the program (top level function-like thing)
// has changed.

//TODO translate dalsegno function diff algorithms to JavaScript diffing acorn ASTs.


function findNamedFunctions(ast){
  var nodes = [];
  acorn.walk.simple(ast, {'FunctionDeclaration':function(x){ nodes.push(x); }});
  return nodes;
}

function diff(n1, n2, ignoreNamedFunctions){
  ignoreNamedFunctions = ignoreNamedFunctions || false;
  if (n1 === null || typeof n1 === 'boolean' || typeof n1 === 'undefined' ||
      typeof n1 === 'number' || typeof n1 === 'string'){
    return n1 !== n2;
  }
  if (Object.keys(n1).length !== Object.keys(n2).length){ return true; }
  if (Array.isArray(n1)){
    for (var i=0; i<n1.length; i++){
      if (diff(n1[i], n2[i], ignoreNamedFunctions)){ return true; }
    }
    return false;
  }
  if (ignoreNamedFunctions && n1.type === 'FunctionDeclaration'){
    // function declarations must only have the same name to be considered
    // identical for purposes of the outer function;
    return (n1.id.name !== n2.id.name || diff(n1.params, n2.params));
  } else {
    for (var prop in n1){
      if (prop === 'start' || prop === 'end'){ continue; }
      if (diff(n1[prop], n2[prop], ignoreNamedFunctions)){ return true; }
    }
    return false;
  }
}

// returns whether two ASTs are identical ignoring named function definitions
// but counting named function bodies
function diffIgnoringFunctionDeclarations(n1, n2){
  return diff(n1, n2, true);
}

function functionNameUsedMoreThanOnce(ast){
  var funcs = findNamedFunctions(ast);
  names = {};
  funcs.map(function(x){ names[x.id.name] = true; });
  return Object.keys(names) > funcs.length;
}

// returns a JSON representation with location data removed
function withoutLocations(ast){

}


function functionBodiesDifferent(f1, f2){
}

function namedFunctionsByName(ast){
  var funcs = findNamedFunctions(ast);
  names = {};
  funcs.map(function(x){ names[x.id.name] = x; });
  return names;
}

// Returns an object with names of updated (or new) functions
// as properties and values being the new function objects,
// to use for updating that function body
// If '*main*' is listed, something top level has changed.
function changedNamedFunctions(a, b){
  if (diffIgnoringFunctionDeclarations(a, b)){
    return {'*main*': b};
  }
  var funcs1 = namedFunctionsByName(a);
  var funcs2 = namedFunctionsByName(b);
  //var added = Object.keys(funcs2).filter(function(name){ return !funcs1.hasOwnProperty(name); });
  //var removed = Object.keys(funcs1).filter(function(name){ return !funcs2.hasOwnProperty(name); });
  var modified = Object.keys(funcs2).filter(function(name){
    return (diffIgnoringFunctionDeclarations(funcs1[name].body, funcs2[name].body));
  });
  var modifiedObjects = {};
  for (var name of modified){
    modifiedObjects[name] = funcs2[name];
  }
  //TODO think about when these need to be deep-copied
  return modifiedObjects;
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

  //console.log(diffIgnoringFunctionDeclarations(ast1, ast2));
  console.log(changedNamedFunctions(ast1, ast2));
  //console.log(diffFunctionDeclarations(ast1, ast2)
  //findNamedFunctions(ast1);
}
test();

exports.changedNamedFunctions = changedNamedFunctions;
exports.diffIgnoringFunctionDeclarations = diffIgnoringFunctionDeclarations;
exports.diff = diff;
