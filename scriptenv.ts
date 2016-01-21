import evaluation = require('./eval');
var ai = require('./ai');

interface YieldFunction {
    (...args:any[]): ()=>boolean;
    finish(...args: any[]): (any);
    requiresYield: boolean;
}

var waitTwo = <YieldFunction>function(){
    var t0 = new Date().getTime();
    return function(){
        console.log('checking...')
        var t1 = new Date().getTime();
        return t1 - t0 > 2000;
    }
}
waitTwo.requiresYield = true;
waitTwo.finish = function(){
    console.log('hello 2 seconds later!');
};

var funcs = {
    '+': function(){
      return Array.prototype.slice.call(arguments).reduce(function(a:number, b:number){
        return a + b;
      }, 0);
    },
    '*': function(a:number, b:number){ return a * b; },
    'waitTwo': waitTwo,
}

function makeControls(){

    var e = <any>undefined;
    function setCurrentEntity(ent:any){
        e = ent;
    }

    var thrustFor = <YieldFunction>function(){
        var t0 = new Date().getTime();
        return function(){
            console.log('checking...')
            var t1 = new Date().getTime();
            return t1 - t0 > 2000;
    }
    thrustFor.requiresYield = true;
    thrustFor.finish = function(){
        e.thrust = e.maxThrust;
        e.thrust = 0;
        }
    }

    var controls:{[name: string]: YieldFunction} = {
        thrustFor: thrustFor,
    }
    return [setCurrentEntity, controls];
}



//TODO make piloting things available here

export function buildShipEnv():evaluation.Environment{
    return new evaluation.Environment([console, funcs, {}]);
}
