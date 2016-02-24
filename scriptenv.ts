import * as evaluation from './eval';
import { Ship } from './entity';
import { Player } from './player';
var manual = require('./manual');
import * as ships from './ships';
import { putMessage } from './messagelog';
import { headingDiff } from './shipmath';

import { GameTime, Interpreter, JSInterpAsyncInput } from './interfaces';

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
interface NamespaceInit{
    interpreterInit(interpreter: Interpreter, scope: any): void;
    shiplangInit(obj: any): void;
}

class Data {
    constructor(public name: string, public getter: ()=>any){}
    // JSInterpreter doesn't implement properties, so have to use functions
    interpreterInit(interpreter: Interpreter, scope: any){
        var getter = <()=>any>(function(){ return interpreter.createPrimitive(this.getter()); });
        interpreter.setProperty(scope, this.name, interpreter.createNativeFunction(getter));
    }
    shiplangInit(obj: any){
        Object.defineProperty(obj, this.name, { get: this.getter });
    }
    // So long as an entity, game time, and game world are
}

class Command {
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
    isAsync: boolean;
    interpreterInit(interpreter: Interpreter, scope: any){
        var self = this;
        interpreter.setProperty(scope, this.name, interpreter.createNativeFunction(function(){
            var args = <any[]>[];
            for (var i=0; i<self.paramTypes.length; i++){
                if (i >= arguments.length){ break; }
                if (self.paramTypes[i] && arguments[i].type !== self.paramTypes[i]){
                    throw new Error('Expected arg '+i+' to be a '+self.paramTypes[i]);
                }
            }
            for (var i=0; i<arguments.length; i++){
                if (arguments[i].type === 'function'){
                    args.push(arguments[i]);
                } else {
                    args.push(arguments[i].data);
                    // TODO do some more typechecking here
                }
            }
            return interpreter.createPrimitive(self.body.apply(null, args));
        }));
    }
    shiplangInit(obj: any){
        obj[this.name] = this.body;
    }
}

class AsyncCommand extends Command implements NamespaceInit{
    constructor(name: string,
                body: any, // should return a ()=>boolean
                public onFinish?: any, // same signature as body
                paramTypes?: string[],
                numRequiredParams?: number){
        super(name, body, paramTypes, numRequiredParams);
        this.isAsync = true;
        if (onFinish === undefined){
            this.onFinish = function(){};
        }
    }
    interpreterInit(interpreter: Interpreter, scope: any){
        var self = this;
        var asyncFunction = <JSInterpAsyncInput>function(){
            var args = <any[]>[];
            for (var i=0; i<self.paramTypes.length; i++){
                if (i >= arguments.length){ break; }
                if (self.paramTypes[i] && arguments[i].type !== self.paramTypes[i]){
                    throw new Error('Expected arg '+i+' to be a '+self.paramTypes[i]);
                }
            }
            for (var i=0; i<arguments.length; i++){
                if (arguments[i].type === 'function'){
                    args.push(arguments[i]);
                } else {
                    args.push(arguments[i].data);
                    // TODO do some more typechecking here
                    // also deduplicate this code with a parent method
                }
            }
            var val = self.body.apply(null, args);
            return val;
        }
        var finishFunction = function(){
            var args = <any[]>[];

            // alr: ()=>(boolean|string)eady did typechecking when asyncFunction was called
            for (var i=0; i<arguments.length; i++){
                args.push(arguments[i].data);
            }
            return interpreter.createPrimitive(self.onFinish.apply(null, args));
        }
        asyncFunction.finish = finishFunction;
        interpreter.setProperty(scope, this.name, interpreter.createAsyncFunction(asyncFunction));
    }
    shiplangInit(obj: any){
        this.body.finish = this.onFinish;
        this.body.requiresYield = true;
        obj[this.name] = this.body;
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

type MakeCommandsReturnType = [(e: any)=>void,
                               (t: any)=>void,
                               (w: any)=>void,
                               (k: any)=>void,
                               NamespaceInit[]];

// Functions available to scripts
function makeCommands():MakeCommandsReturnType{

    // data all control functions close over
    var e = <Ship>undefined;
    var t = <GameTime>undefined;
    var w = <any>undefined;
    var keys = <any>undefined;
    function setCurrentEntity(ent:any){ e = ent; }
    function setGameTime(time:GameTime){ t = time; }
    function setGameWorld(world: any){ w = world; }
    function setKeyControls(keyControls: any){ keys = keyControls; }
    var keygen = <any>undefined;

    var commands = [
        new Command('fullThrust', function(){ e.thrust = e.maxThrust; }),
        new Command('cutThrust', function(){ e.thrust = 0; }),
        new Command('fullLeft', function(){ e.dh = -e.maxDH; }),
        new Command('fullRight', function(){ e.dh = e.maxDH; }),
        new Command('noTurn', function(){ e.dh = 0; }),
        new Command('distToClosestShip', function(){ return w.distToClosestShip(e); }),
        new Command('headingToClosestShip', function():any{ return e.towards(w.findClosestShip(e)); }),
        new Command('headingToClosest', function():any{ return e.towards(w.findClosest(e)); }),
        new Command('headingToClosestComponent', function():any{ return e.towards(w.findClosestComponent(e)); }),
        new Command('distToClosestComponent', function():any{ return e.distFrom(w.findClosestComponent(e)); }),
        new Command('headingToClosestPlanet', function():any{ return e.towards(w.findClosestBackgroundEntity(e)); }),
        new Command('distToClosestPlanet', function():any{ return e.distFrom(w.findClosestBackgroundEntity(e)); }),
        new Command('headingToNthPlanet', function(i: number):any{ return e.towards(w.bgEntities[i % w.bgEntities.length]); }),
        new Command('distToNthPlanet', function(i: number):any{ return e.distFrom(w.bgEntities[i % w.bgEntities.length]); }),

        new AsyncCommand('keypress', function(){
            keygen = manual.actOnKey(e, keys)
            var {value, done} = keygen.next()
            if (done) { throw Error('expected done to be false'); }
            return value;
        }, function(){
            var {value, done} = keygen.next()
            if (!done) { throw Error('expected done to be true'); }
            return value;
        }),

        new Command('keyPressed', function(name: string){
            return keys.isPressed(name);
        }),

        new AsyncCommand('waitFor', function(n: number):any{
            var timeFinished = t + n;
            return function(){
                return t > timeFinished;
            }
        }),

        new AsyncCommand('turnTo', function(hTarget: number):any{
            e.hTarget = hTarget;
            return function(){ return e.hTarget === undefined; }
        }),

        new Command('detonate', function():any{
            e.r = e.explosionSize;
            e.type = 'explosion';
            e.dx = e.dx/Math.abs(e.dx)*Math.pow(Math.abs(e.dx), .2) || 0;
            e.dy = e.dy/Math.abs(e.dy)*Math.pow(Math.abs(e.dy), .2) || 0;
            return 'done';
        }),

        new AsyncCommand('land', function():any{
            var closest = w.findClosestBackgroundEntity(e);
            if (!closest) { return function(){ return true; }; }
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
        }),

        new AsyncCommand('jump', function():any{
            var closest = w.findClosestBackgroundEntity(e);
            if (closest && e.distFrom(closest) < 400){
                putMessage('Too close to a planet to make the jump into hyperspace');
                return function(){ return true; };
            }
            if (e.speed() > 30){
                putMessage('Moving too quickly to make the jump into hyperspace');
                return function(){ return true; };
            }
            Player.fromStorage().set('spaceLocation', [0, 0]);
            var current = Player.fromStorage().location;
            var next = current === 'Sol' ? 'robo' : 'Sol';
            Player.fromStorage().set('location', next).go();
            return 'done';
        }),

        new AsyncCommand('attach', function():any{
            return function(){ return true; }
        }, function(): boolean{
            var closest = w.findClosestComponent(e);
            if (!closest) { return false; }
            if (e.distFrom(closest) < closest.r*2 + e.r && e.speed() < 30){
                closest.attachedTo = e;
                closest.yOffset = 5;
                closest.xOffset = 5;
                return true;
            }
            return false;
        }),

        new AsyncCommand('fireMissile', function(script: any, color: string): any{
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
        }),

        new Command('fireNeedleMissile', function(script: any, color: string): any{
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
        }),

        new AsyncCommand('fireLaser', function(color: string): any{
            var startTime = t;
            w.fireLaser(e, color);
            return function(){
                if (t < startTime + .1){
                    return false;
                } else {
                    return true;
                }
            }
        }),

        new AsyncCommand('thrustFor', function(n: number): any{
            e.thrust = e.maxThrust;
            var timeFinished = t + n;
            return function(){
                return t > timeFinished;
            }
        }, function(){ e.thrust = 0; }),

        new AsyncCommand('leftFor', function(n: number): any{
            e.dh = e.maxDH;
            var timeFinished = t + n;
            return function(){ return t > timeFinished; }
        }, function(){ e.dh = 0; }),

            new AsyncCommand('rightFor', function(n: number): any{
            e.dh = -e.maxDH;
            var timeFinished = t + n;
            return function(){ return t > timeFinished; }
        }, function(){ e.dh = 0; }),

        new Data('x', function(){ return e.x; }),
        new Data('y', function(){ return e.y; }),
        new Data('dx', function(){ return e.dx; }),
        new Data('dy', function(){ return e.dy; }),
        new Data('r', function(){ return e.r; }),
        new Data('h', function(){ return e.h; }),
        new Data('dh', function(){ return e.dh; }),
        new Data('maxDH', function(){ return e.maxDH; }),
        new Data('maxThrust', function(){ return e.maxThrust; }),
        new Data('maxSpeed', function(){ return e.maxSpeed; }),
        new Data('speed', function(){ return e.speed(); }),
        new Data('vHeading', function(){ return e.vHeading(); }),
    ];
    return [setCurrentEntity, setGameTime, setGameWorld, setKeyControls, commands];
}

function makeControls(commands: any): any{
    var controls = {};
    for (var cmd of commands){
        cmd.shiplangInit(controls);
    }
    // So long as an entity, game time, and game world are
    // reset (so copies don't happen during ticks) a controls
    // object doesn't need to be copied.
    Object.defineProperty(controls, '__deepCopyPassthrough', {value: true})
    return controls;
}

export var [setCurrentEntity, setGameTime, setGameWorld,
     setKeyControls, commands] = makeCommands();
export var controls = makeControls(commands);

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
    for (var cmd of commands){
        cmd.interpreterInit(interpreter, scope);
    }
    interpreter.setProperty(scope, 'log', interpreter.createNativeFunction(
        function(x: any){ console.log('from jsinterp:', x);
    }));
}
