import { Environment, CompiledFunctionObject, initialize, runBytecodeOneStep } from './eval';
import { Entity, Ship } from './entity';  // just for the types
import { initShipEnv } from './scriptenv';
import { UserFunctionBodies } from './userfunctionbodies';
import { Selection, Interpreter, Generator, ByteCode, Context, JSInterpFunction } from './interfaces'

var deepcopy = require('deepcopy');
var JSInterpreter = require('Interpreter');

export class NOPContext implements Context {
    contructor(){
        this.done = true;
    }
    done: boolean;
    cleanup(){};
    step(e: Ship){}
    safelyStep(e: Ship, onError: (e: string)=>void){ return true; }
}

export class SLContext implements Context {
    constructor(source: string, env: Environment){
        this.source = source;
        this.done = false;
        this.initialEnv = env;
    }
    source: string;
    initialEnv: Environment;
    bytecodeStack: ByteCode[][];
    counterStack: number[];
    envStack: Environment[];
    stack: any[];
    readyCallback: ()=>boolean;
    done: boolean;

    static fromFunction(f: CompiledFunctionObject):SLContext {
        if (f.params.length !== 0){ throw Error('Only functions that take no parameters can be scripts'); }
        var name = f.name || 'anonymous function';
        var context = new SLContext(name, undefined);
        context.bytecodeStack = <ByteCode[][]>[f.code];
        context.stack = <any[]>[];
        context.counterStack = [0];
        context.envStack = [deepcopy(f.env)];
        // context is ready
        return context
    }

    cleanup(){};
    deepCopyCreate():SLContext{
        return new SLContext(undefined, undefined);
    }
    deepCopyPopulate(copy:SLContext, memo:any, deepcopy:any){
        copy.source = this.source
        copy.done = this.done;
        copy.initialEnv = this.initialEnv;
        if (this.bytecodeStack !== undefined){
            copy.bytecodeStack = this.bytecodeStack.slice(0) // the bytecode chunks don't mutate
            copy.stack = deepcopy(this.stack, memo);
            copy.counterStack = deepcopy(this.counterStack, memo);
            copy.envStack = deepcopy(this.envStack, memo);
        }
        copy.readyCallback = this.readyCallback;
    }

    step(e: Ship){
        if (this.done){ return; }
        if (this.bytecodeStack === undefined){
            if (this.source === undefined){ throw Error('needs source!'); }
            if (this.initialEnv === undefined){ throw Error('needs initialEnv!'); }
            [this.bytecodeStack, this.counterStack, this.envStack, this.stack] = initialize(this.source, this.initialEnv);
            this.initialEnv = undefined;
            // context is ready
        }
        if (this.readyCallback !== undefined && !this.readyCallback()){
            return;
        }
        while (true) {
            var result = runBytecodeOneStep(this.counterStack,
                                               this.bytecodeStack,
                                               this.stack,
                                               this.envStack);
            if (result === undefined) {
                continue;
            } else if (result === 'done'){
                this.done = true;
                break;
            } else {
                this.readyCallback = result;
                break;
            }
        }
    }

    safelyStep(e: Ship, onError: (e: string)=>void){
        try{
            this.step(e);
            return true;
        } catch (e) {
            onError(e)
            return false;
        }
    }
}

var MAXSTEPS = 100000;
export class JSContext implements Context {
    constructor(public source: string, public userFunctionBodies?: UserFunctionBodies, public highlight?: (id: string, selections: Selection[])=>void){
        this.highlightId = Math.random().toString(36).substring(1); // id currently just used for highlighting
    }
    done: boolean;
    interpreter: Interpreter;
    highlightId: string;
    cleanup(){ // TODO call cleanup somewhere
        if (this.highlight){
            this.highlight(this.highlightId, []);
        }
    }
    step(e: Ship){
        if (this.interpreter === undefined){
            if (this.userFunctionBodies){
                this.interpreter = new JSInterpreter(this.source, initShipEnv, undefined, this.userFunctionBodies);
            } else {
                this.interpreter = new JSInterpreter(this.source, initShipEnv);
            }
        }

        // infinite loop prevention
        for (var i=0; i<MAXSTEPS; i++){
            var unfinished = this.interpreter.step();
            if (unfinished && this.interpreter.paused_){ return true; }
            if (!unfinished){ return false; }
        }

        return true;
    }
    safelyStep(e: Ship, onError: (e: string)=>void){
        if (this.done){ return; }
        //try{
            var unfinished = this.step(e);
            if (!unfinished){
                this.done = true;
                //console.log('finished JS script');
            }

            if (this.highlight){
                if (this.interpreter.stateStack[0]) {
                    var node = this.interpreter.stateStack[0].node;
                    this.highlight(this.highlightId, this.interpreter.stateStack.slice(0, -1).map(function(state: any){
                        return {start: state.node.start, finish: state.node.end};
                    }));
                } else {
                    this.highlight(this.highlightId, []);
                }
            }

            return true;

        //} catch (e) {
        //    onError(e)
        //    return false;
        //}
    }
    forkWithFunction(func: JSInterpFunction):JSContext{
        var copy = deepcopy(this);
        copy.interpreter.paused_ = false;
        copy.interpreter.isReady = function(){ return true; }
        copy.interpreter.exec(func) //TODO need to get this function from the copy instead!
        return copy;
    }
    deepCopyCreate():JSContext{
        return new JSContext(undefined);
    }
    deepCopyPopulate(copy:JSContext, memo:any, deepcopy:any){
        copy.done = this.done
        if (this.interpreter){
            copy.interpreter = (<any>this.interpreter).copy();
        }
        copy.highlight = this.highlight; // function
        copy.source = this.source; // immutable string
        copy.userFunctionBodies = this.userFunctionBodies; // global
    }
}

export class JSGeneratorContext implements Context {
    constructor(script: (e: Entity)=>Generator){
        this.script = script
        this.done = false;
    }
    script: (e: Entity)=>Generator;
    generator: Generator;
    readyCallback: ()=>boolean;
    done: boolean;

    cleanup(){};
    safelyStep(e: Ship, onError: (e: string)=>void): boolean{
        return this.step(e);
    }
    step(e: Ship): boolean{
        if (this.done){ return; }
        if (this.generator === undefined){
            if (this.script === undefined){
                throw Error("need script to run for " + e);
            }
            this.generator = this.script(e);
        }
        // assert: generator exists!

        if (this.readyCallback === undefined){
            var request = this.generator.next();
            if (request.done){
                console.log('script done, it never yielded for entity '+e);
                this.done = true;
                return;
            }
            this.readyCallback = request.value;
        }
        // assert: e.readyCallback exists

        while (this.readyCallback()){
            request = this.generator.next();
            if (request.done){
                console.log('script done for e', e);
                this.done = true;
                break;
            } else {
                if (request.value === 'done'){
                    this.done = true;
                    break
                } else if (request.value === 'done') { // detonate does this;
                    this.done = true;
                    break;
                } else {
                    this.readyCallback = request.value;
                }
            }
        }
    }
}
