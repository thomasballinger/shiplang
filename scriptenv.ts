import evaluation = require('./eval');
import entity = require('./entity');
var ai = require('./ai');

type GameTime = number;

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

    var e = <entity.Ship>undefined;
    var t = <GameTime>undefined;
    function setCurrentEntity(ent:any){
        e = ent;
    }
    function setGameTime(time:GameTime){
        t = time;
    }

    // Functions available to scripts
    //
    // It's advisable to let the argument undefined do something reasonable
    //
    //TODO add arity checks to these (maybe ranges?) and ideally have a parse
    //step that looks for them!

    var thrustFor = <YieldFunction>function(n){
        e.thrust = e.maxThrust;
        var timeFinished = t + n;
        return function(){ return t > timeFinished; }
    }
    thrustFor.requiresYield = true;
    thrustFor.finish = function(){ e.thrust = 0; }

    var leftFor = <YieldFunction>function(n){
        e.dh = e.maxDH;
        var timeFinished = t + n;
        return function(){ return t > timeFinished; }
    }
    leftFor.requiresYield = true;
    leftFor.finish = function(){ e.dh = 0; }

    var controls:{[name: string]: YieldFunction} = {
        thrustFor: thrustFor,
        leftFor: leftFor,
    }
    Object.defineProperty(controls, 'x', { get: function() { return e.x; }, });
    Object.defineProperty(controls, 'y', { get: function() { return e.y; }, });
    Object.defineProperty(controls, 'dx', { get: function() { return e.dx; }, });
    Object.defineProperty(controls, 'dy', { get: function() { return e.dy; }, });
    return [setCurrentEntity, setGameTime, controls];
}

export var [setCurrentEntity, setGameTime, controls] = makeControls();

//TODO make piloting things available here

export function buildShipEnv():evaluation.Environment{
    return new evaluation.Environment([console, controls, funcs, {}]);
}
