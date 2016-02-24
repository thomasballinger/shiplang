import * as evaluation from './eval';
import { Ship } from './entity';
import { Player } from './player';
var manual = require('./manual');
import * as ships from './ships';
import { putMessage } from './messagelog';
import { headingDiff } from './shipmath';

import { GameTime } from './interfaces';

interface YieldFunction {
    (...args:any[]): ()=>(boolean|string);
    finish(...args: any[]): (any);
    requiresYield: boolean;
}

//TODO redesign this module to manufacture functions for either
//     style, JSInterpreter or SL
//
//     Need to work in three situations:
//     * ShipLang
//       * function to run
//       * whether async
//       * if async, function for checking if done
//       * if async, function to call when done
//       * can be property access
//     * JS
//       * whether async
//       * type of return value
//       * types of parameters
//     * custom blockly block
//       * requirements for JS interp
//       * types of inputs (including degrees)
//       * color
//
//     Eventually want a system for specifying which are legal to call

class SyncronousCommand{
    constructor(public name: string,
                public body: any, // function with any signature
                public paramTypes?: string[],
                public numRequiredParams?: number){
        if (paramTypes === undefined){
            this.paramTypes = paramTypes = [];
        }
        if (numRequiredParams === undefined){
            this.numRequiredParams = paramTypes.length;
        }
    }
    interpreterInit(interpreter: any, scope: any){
        var self = this;
        interpreter.setProperty(scope, this.name, interpreter.createNativeFunction(function(){
            var args = <any[]>[];
            for (var i=0; i<self.paramTypes.length; i++){
                if (i >= arguments.length){ break; }
                if (self.paramTypes[i] && arguments[i].type !== self.paramTypes[i]){
                    throw new Error('Expected arg '+i+' to be a '+self.paramTypes[i]);
                }
                args.push(arguments[i].data);
            }
            return interpreter.createPrimitive(self.body.apply(null, arguments));
        }));
    }
}

// Allow ShipLang programs to use JavaScript builtins
// Only used for ShipLang programs
var funcs = {
    '+': function(){
      return Array.prototype.slice.call(arguments).reduce(function(a:number, b:number){
        return a + b;
      }, 0);
    },
    '*': function(a:number, b:number){ return a * b; },
    '/': function(a:number, b:number){ return a / b; },
    '>': function(a:number, b:number){ return a > b; },
    '<': function(a:number, b:number){ return a < b; },
    '=': function(a:any, b:any){
        if (typeof a === 'string' && typeof b === 'string'){
            return a.toLowerCase() === b.toLowerCase();
        }
        return a === b;
    },
    'headingDiff': function(a: number, b: number){ return headingDiff(a, b); },
    'and': function(a: boolean, b: boolean){ return a && b; },
    'or': function(a: boolean, b: boolean){ return a || b; },
    'opp': function(degrees: number){ return (degrees + 180) % 360; },
}
// Even though it wouldn't hurt to copy this object, all the functions would
// be deepCopy passthroughs anyway. If a way to *modify* this array were added,
// in addition to deepCopying being an issue communication between simultaneously
// running scripts could be achieved through it!
Object.defineProperty(funcs, '__deepCopyPassthrough', {value: true})

type MakeControlsReturnType = [(e: any)=>void,
                               (t: any)=>void,
                               (w: any)=>void,
                               (k: any)=>void,
                               {[a:string]:any;}];

function makeControls():MakeControlsReturnType{
    var e = <Ship>undefined;
    var t = <GameTime>undefined;
    var w = <any>undefined;
    var keys = <any>undefined;
    function setCurrentEntity(ent:any){ e = ent; }
    function setGameTime(time:GameTime){ t = time; }
    function setGameWorld(world: any){ w = world; }
    function setKeyControls(keyControls: any){ keys = keyControls; }

    // Functions available to scripts
    //
    // It's advisable to let the argument undefined do something reasonable
    //
    //TODO add arity checks to these (maybe ranges?) and ideally have a parse
    //step that looks for them!

    var keygen = <any>undefined;
    var keypress = <YieldFunction>function(){
        keygen = manual.actOnKey(e, keys)
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

    var keyPressed = function(name: string){
        return keys.isPressed(name);
    }

    //TODO why do I have to annotate these with 'any'?
    var waitFor = <YieldFunction>function(n):any{
        if (n.isPrimitive){ n = n.data; }
        var timeFinished = t + n;
        return function(){
            return t > timeFinished;
        }
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
      e.r = e.explosionSize;
      e.type = 'explosion';
      e.dx = e.dx/Math.abs(e.dx)*Math.pow(Math.abs(e.dx), .2) || 0;
      e.dy = e.dy/Math.abs(e.dy)*Math.pow(Math.abs(e.dy), .2) || 0;
      return 'done';
    }
    detonate.requiresYield = true;
    detonate.finish = function(){}

    var land = <YieldFunction>function():any{
        var closest = w.findClosestBackgroundEntity(e);
        if (!closest) { return function(){ return true; }; }
        console.log(closest, e.speed(), closest.landOn);
        if (e.distFrom(closest) > closest.r){
            putMessage('Not close enough to a planet to land');
            return function(){ return true; };
        }
        if (e.speed() > 30){
            putMessage('Moving too quickly to land on this planet');
            return function(){ return true; };
        }
        if (!closest.onLand){
            putMessage("Can't land on this planet yet, sorry!");
            return function(){ return true; };
        }
        Player.fromStorage().set('spaceLocation', [e.x, e.y]);
        closest.onLand();
        return 'done';
    }
    land.requiresYield = true;
    land.finish = function(){};

    var attach = <YieldFunction>function():any{
        return function(){ return true; }
    }
    attach.requiresYield = true;
    attach.finish = function(){
        var closest = w.findClosestComponent(e);
        if (!closest) { return function(){ return true; }; }
        if (e.distFrom(closest) < closest.r*2 + e.r &&
                e.speed() < 30){
            closest.attachedTo = e;
            closest.yOffset = 5;
            closest.xOffset = 5;
            return true;
        }
        return false;
    };

    var fireMissile = <YieldFunction>function(script, color):any{
        var startTime = t;
        var missileFired = false;
        return function(){
            if (t < startTime + .1){
                return false;
            } else if (!missileFired){
                // TODO fork the interpreter here
                // If the script passed in is a JS-Interpreter function,
                // fork the interpreter and pass a script tuple
                // with that forked interpreter.
                // TODO dispatch on context maybe?
                if (script instanceof evaluation.CompiledFunctionObject){
                    w.fireMissile(e, ships.DroneMissile, script, color);
                } else {
                    var plsFork = [e.context, script]
                    w.fireMissile(e, ships.DroneMissile, plsFork, color);
                }
                missileFired = true;
            } else if (t < startTime + .3){
                return false;
            } else {
                return true;
            }
        }
    }
    fireMissile.requiresYield = true;
    fireMissile.finish = function(){}

    var fireNeedleMissile = <YieldFunction>function(script, color):any{
        var startTime = t;
        var missileFired = false;
        return function(){
            if (t < startTime + .1){
                return false;
            } else if (!missileFired){
                w.fireMissile(e, ships.NeedleMissile, script, color);
                missileFired = true;
            } else if (t < startTime + .2){
                return false;
            } else {
                return true;
            }
        }
    }
    fireNeedleMissile.requiresYield = true;
    fireNeedleMissile.finish = function(){}

    var fireLaser = <YieldFunction>function(color):any{
        var startTime = t;
        w.fireLaser(e, color);
        return function(){
            if (t < startTime + .1){
                return false;
            } else {
                return true;
            }
        }
    }
    fireLaser.requiresYield = true;
    fireLaser.finish = function(){}

    var thrustFor = <YieldFunction>function(n):any{
        e.thrust = e.maxThrust;
        var timeFinished = t + n;
        return function(){ return t > timeFinished; }
    }
    thrustFor.requiresYield = true;
    thrustFor.finish = function(){ e.thrust = 0; }

    var commands = [
        new SyncronousCommand('fullThrust', function(){ e.thrust = e.maxThrust; }),
        new SyncronousCommand('cutThrust', function(){ e.thrust = 0; }),
        new SyncronousCommand('fullLeft', function(){ e.dh = -e.maxDH; }),
        new SyncronousCommand('fullRight', function(){ e.dh = e.maxDH; }),
        new SyncronousCommand('noTurn', function(){ e.dh = 0; }),
    ];

    // temp hack while refactoring into commands
    (<any>window).commands = commands;

    var leftFor = <YieldFunction>function(n):any{
        e.dh = e.maxDH;
        var timeFinished = t + n;
        return function(){ return t > timeFinished; }
    }
    leftFor.requiresYield = true;
    leftFor.finish = function(){ e.dh = 0; }

    var rightFor = <YieldFunction>function(n):any{
        e.dh = -e.maxDH;
        var timeFinished = t + n;
        return function(){ return t > timeFinished; }
    }
    rightFor.requiresYield = true;
    rightFor.finish = function(){ e.dh = 0; }

    var controls:{[name: string]: YieldFunction} = {
        thrustFor: thrustFor,
        leftFor: leftFor,
        rightFor: rightFor,
        fireMissile: fireMissile,
        fireNeedleMissile: fireNeedleMissile,
        fireLaser: fireLaser,
        waitFor: waitFor,
        turnTo: turnTo,
        detonate: detonate,
        distToClosestShip: <YieldFunction>function(){ return w.distToClosestShip(e); },
        headingToClosestShip: <YieldFunction>function():any{ return e.towards(w.findClosestShip(e)); },
        headingToClosest: <YieldFunction>function():any{ return e.towards(w.findClosest(e)); },
        headingToClosestComponent: <YieldFunction>function():any{ return e.towards(w.findClosestComponent(e)); },
        distToClosestComponent: <YieldFunction>function():any{ return e.distFrom(w.findClosestComponent(e)); },
        headingToClosestPlanet: <YieldFunction>function():any{ return e.towards(w.findClosestBackgroundEntity(e)); },
        distToClosestPlanet: <YieldFunction>function():any{ return e.distFrom(w.findClosestBackgroundEntity(e)); },
        headingToNthPlanet: <YieldFunction>function(i: number):any{ return e.towards(w.bgEntities[i % w.bgEntities.length]); },
        distToNthPlanet: <YieldFunction>function(i: number):any{ return e.distFrom(w.bgEntities[i % w.bgEntities.length]); },
        keypress: keypress,
        keyPressed: <YieldFunction>keyPressed,
        land: <YieldFunction>land,
        attach: <YieldFunction>attach,
    }
    for (var command of commands){
        controls[command.name] = <YieldFunction>command.body;
    }

    function makeAccessor(prop: string){ return function() { return e[prop]; }; }

    for (var propname of ['x', 'y', 'dx', 'dy', 'h', 'r', 'dh', 'maxDH',
                          'maxThrust', 'maxSpeed']){
        Object.defineProperty(controls, propname, { get: makeAccessor(propname) });
    }
    Object.defineProperty(controls, 'speed', { get: function() { return e.speed(); }, });
    Object.defineProperty(controls, 'vHeading', { get: function() { return e.vHeading(); }, });





    // So long as an entity, game time, and game world are
    // reset (so copies don't happen during ticks) a controls
    // object doesn't need to be copied.
    Object.defineProperty(controls, '__deepCopyPassthrough', {value: true})
    return [setCurrentEntity, setGameTime, setGameWorld, setKeyControls, controls];
}

export var [setCurrentEntity, setGameTime, setGameWorld,
     setKeyControls, controls] = makeControls();
//var stuff = makeControls();
//export var setCurrentEntity = <(x: any)=>void>stuff[0]

export function SLgetScripts(s: string){
    var ast = evaluation.parser.parse(s);
    var env = buildShipEnv();
    var code = ast.compile();
    evaluation.runBytecode(code, env, function(x){
        throw Error("yielding not allowed at top level");
    });
    return env.scopes[env.scopes.length-1];
}

export function SLFunctionFromString(s: string){
    var ast = evaluation.parser.parse(s);
    var env = buildShipEnv();
    var code = ast.compile();
    code.push([evaluation.BC.Return, null]);
    var func = new evaluation.CompiledFunctionObject([], code, env, 'fromString')
    return func;
}

export function buildShipEnv():evaluation.Environment{
    return new evaluation.Environment([console, controls, funcs, {}]);
}

export function initShipEnv(interpreter: any, scope: any){
    for (var prop of Object.keys(controls)){
        if (controls[prop].requiresYield){
            if (!controls[prop].finish){ continue; }
            interpreter.setProperty(scope, prop,
                interpreter.createAsyncFunction(controls[prop]));
        }
    }
    interpreter.setProperty(scope, 'log',
        interpreter.createNativeFunction(function(x: any){ console.log('from jsinterp:', x); }));

    for (var command of (<any>window).commands){
        command.interpreterInit(interpreter, scope);
    }

    interpreter.setProperty(scope, 'keyPressed',
        interpreter.createNativeFunction(function(x: any){
            if (!x.isPrimitive || x.type !== 'string' || typeof x.data !== 'string'){
                throw Error('not a string');
            }
            var s = x.data;
            return interpreter.createPrimitive(controls['keyPressed'](s));
        }));
    interpreter.setProperty(scope, 'distToClosestShip',
        interpreter.createNativeFunction(function(){
            return interpreter.createPrimitive(controls['distToClosestShip']());
        }));
    function fireMissileAsync(script: any, color?: any){
        if (script === undefined){ throw Error('Firing a missile requires a script'); }
        if (script.type !== 'function'){
            throw Error('provided script is supicious...');
        }
        if (color === undefined){
            color = {data: undefined, isPrimitive: true};
        } else if (!color.isPrimitive || color.type !== 'string' || typeof color.data !== 'string'){
            throw Error('provided color not a string');
        }
        var color = color.data;
        return controls['fireMissile'](script, color);
    }
    (<any>fireMissileAsync).finish = (<any>controls['fireMissile']).finish;
    interpreter.setProperty(scope, 'fireMissile',
        interpreter.createAsyncFunction(fireMissileAsync));
    for (var prop of ['x', 'y', 'dx', 'dy', 'h', 'r', 'dh', 'maxDH', 'maxThrust', 'maxSpeed', 'speed', 'vHeading']){
        // these are properties hopefully?
        interpreter.setProperty(scope, prop,
            interpreter.createNativeFunction(
                (function(p: any){
                    return function(){
                        return interpreter.createPrimitive(controls[p]);
                    };
                })(prop)));
    }
}
