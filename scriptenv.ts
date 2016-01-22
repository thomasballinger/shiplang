import evaluation = require('./eval');
import entity = require('./entity');
var ai = require('./ai');
var manual = require('./manual');

type GameTime = number;

interface YieldFunction {
    (...args:any[]): ()=>(boolean|string);
    finish(...args: any[]): (any);
    requiresYield: boolean;
}

var waitTwo = <YieldFunction>function():any{
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
    '>': function(a:number, b:number){ return a > b; },
    '<': function(a:number, b:number){ return a < b; },
    'waitTwo': waitTwo,
}

function makeControls(){

    var e = <entity.Ship>undefined;
    var t = <GameTime>undefined;
    var w = <any>undefined;
    var keys = <any>undefined;
    function setCurrentEntity(ent:any){ e = ent; }
    function setGameTime(time:GameTime){ t = time; }
    function setGameWorld(world: any){ w = world; }
    function setKeyControls(keyControls: any){
        keys = keyControls;
    }

    // Functions available to scripts
    //
    // It's advisable to let the argument undefined do something reasonable
    //
    //TODO add arity checks to these (maybe ranges?) and ideally have a parse
    //step that looks for them!

    var keygen = <any>undefined;
    var keypress = <YieldFunction>function(){
        console.log('key requested');
        keygen = keys.getEvent();
        var {value, done} = keygen.next()
        if (done) { throw Error('expected done to be false'); }
        return value;
    }
    keypress.requiresYield = true;
    keypress.finish = function(){
        var {value, done} = keygen.next()
        if (!done) { throw Error('expected done to be true'); }
        return value;
    }

    //TODO why do I have to annotate these with 'any'?
    var waitFor = <YieldFunction>function(n):any{
        var timeFinished = t + n;
        return function(){ return t > timeFinished; }
    }
    waitFor.requiresYield = true;
    waitFor.finish = function(){}

    var turnTo = <YieldFunction>function(hTarget):any{
        e.hTarget = hTarget;
        return function(){ return e.hTarget === undefined; }
    }
    turnTo.requiresYield = true;
    turnTo.finish = function(){}

    var detonate = <YieldFunction>function():any{
      console.log('manual detonation!');
      e.r = e.explosionSize;
      e.type = 'explosion';
      e.dx = e.dx/Math.abs(e.dx)*Math.pow(Math.abs(e.dx), .2) || 0;
      e.dy = e.dy/Math.abs(e.dy)*Math.pow(Math.abs(e.dy), .2) || 0;
      return 'done';
    }
    detonate.requiresYield = true;
    turnTo.finish = function(){}

    var fireMissile = <YieldFunction>function(script, color):any{
        var startTime = t;
        var missileFired = false;
        return function(){
            if (t < startTime + .1){
                return false;
            } else if (!missileFired){
                w.fireMissile(e, script, color);
                missileFired = true;
            } else if (t < startTime + .2){
                return false;
            } else {
                return true;
            }
        }
    }
    fireMissile.requiresYield = true;
    fireMissile.finish = function(){}

    var thrustFor = <YieldFunction>function(n):any{
        e.thrust = e.maxThrust;
        var timeFinished = t + n;
        return function(){ return t > timeFinished; }
    }
    thrustFor.requiresYield = true;
    thrustFor.finish = function(){ e.thrust = 0; }

    var leftFor = <YieldFunction>function(n):any{
        e.dh = e.maxDH;
        var timeFinished = t + n;
        return function(){ return t > timeFinished; }
    }
    leftFor.requiresYield = true;
    leftFor.finish = function(){ e.dh = 0; }

    var controls:{[name: string]: YieldFunction} = {
        thrustFor: thrustFor,
        leftFor: leftFor,
        fireMissile: fireMissile,
        waitFor: waitFor,
        turnTo: turnTo,
        detonate: detonate,
        distToClosestShip: <YieldFunction>function(){ return w.distToClosestShip(e); },
        headingToClosest: <YieldFunction>function():any{ return e.towards(w.findClosestShip(e)); },
        keypress: keypress,
    }
    for (var propname of ['x', 'y', 'dx', 'dy', 'h', 'r', 'dh', 'maxDH',
                          'maxThrust', 'maxSpeed']){
        Object.defineProperty(controls, propname, { get: function() { return e[propname]; }, });
    }
    Object.defineProperty(controls, 'speed', { get: function() { return e.speed(); }, });
    Object.defineProperty(controls, 'vHeading', { get: function() { return e.vHeading(); }, });
    return [setCurrentEntity, setGameTime, setGameWorld, setKeyControls, controls];
}

export var [setCurrentEntity, setGameTime, setGameWorld,
            setKeyControls, controls] = makeControls();

export function getScripts(s: string){
    var ast = evaluation.parser.parse(s);
    var env = buildShipEnv();
    var code = ast.compile();
    evaluation.runBytecode(code, env, function(x){
        throw Error("yielding not allowed at top level");
    });
    return env.scopes[env.scopes.length-1];
}

//TODO make piloting things available here

export function buildShipEnv():evaluation.Environment{
    return new evaluation.Environment([console, controls, funcs, {}]);
}
