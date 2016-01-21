import evaluation = require('./eval');

interface scopeFunction {
  (): any;
  requiresYield: ()=>(()=>boolean);
}

var waitTwo = <scopeFunction>function(){
    console.log('hello 2 seconds later!');
}
waitTwo.requiresYield = function(){
    var t0 = new Date().getTime();
    return function(){
        console.log('checking...')
        var t1 = new Date().getTime();
        return t1 - t0 > 2000;
    }
}

var funcs = {
    '+': function(){
      return Array.prototype.slice.call(arguments).reduce(function(a:number, b:number){
        return a + b;
      }, 0);
    },
    '*': function(a:number, b:number){ return a * b; },

}

//TODO make piloting things available here

export function buildShipEnv():evaluation.Environment{
    return new evaluation.Environment([console, funcs, {}]);
}
