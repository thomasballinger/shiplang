import * as ev from './eval';
import * as entity from './entity';
import * as scriptEnv from './scriptenv';
import * as userfunctionbodies from './userfunctionbodies';

import { Selection, Interpreter, Generator, ByteCode } from './interfaces'

var Interpreter = (<any>window).Interpreter;

export class NOPContext {
    contructor(){
        this.done = true;
    }
    done: boolean;
    step(e:entity.Ship){}
    safelyStep(e: entity.Ship){}
}

export class SLContext {
    constructor(source: string, env: ev.Environment){
        this.source = source;
        this.done = false;
        this.initialEnv = env;
    }
    source: string;
    initialEnv: ev.Environment;
    bytecodeStack: ByteCode[][];
    counterStack: number[];
    envStack: ev.Environment[];
    stack: any[];
    readyCallback: ()=>boolean;
    done: boolean;

    static fromFunction(f: ev.CompiledFunctionObject):SLContext {
        if (f.params.length !== 0){ throw Error('Only functions that take no parameters can be scripts'); }
        var name = f.name || 'anonymous function';
        var context = new SLContext(name, undefined);
        context.bytecodeStack = <ByteCode[][]>[f.code];
        context.stack = <any[]>[];
        context.counterStack = [0];
        context.envStack = [f.env];
        // context is ready
        return context
    }

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

    step(e:entity.Ship){
        if (this.done){ return; }
        if (this.bytecodeStack === undefined){
            if (this.source === undefined){ throw Error('needs source!'); }
            if (this.initialEnv === undefined){ throw Error('needs initialEnv!'); }
            [this.bytecodeStack, this.counterStack, this.envStack, this.stack] = ev.initialize(this.source, this.initialEnv);
            this.initialEnv = undefined;
            // context is ready
        }
        if (this.readyCallback !== undefined && !this.readyCallback()){
            return;
        }
        while (true) {
            var result = ev.runBytecodeOneStep(this.counterStack,
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

    safelyStep(e:entity.Ship, onError: (e: string)=>void){
        try{
            this.step(e);
            return true;
        } catch (e) {
            onError(e)
            return false;
        }
    }
}

var MAXSTEPS = 1000;
export class JSContext {
    constructor(public source: string, public userFunctionBodies?: userfunctionbodies.UserFunctionBodies, public highlight?: (selections: Selection[])=>void){}
    done: boolean;
    interpreter: Interpreter;
    step(e: entity.Ship){
        if (this.interpreter === undefined){
            if (this.userFunctionBodies){
                this.interpreter = new (<any>window).Interpreter(this.source, scriptEnv.initShipEnv, undefined, this.userFunctionBodies);
            } else {
                this.interpreter = new (<any>window).Interpreter(this.source, scriptEnv.initShipEnv);
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
    safelyStep(e:entity.Ship, onError: (e: string)=>void){
        if (this.done){ return; }
        try{
            var unfinished = this.step(e);
            if (!unfinished){
                this.done = true;
                console.log('finished JS script');
            }

            if (this.highlight){
                if (this.interpreter.stateStack[0]) {
                    var node = this.interpreter.stateStack[0].node;
                    this.highlight(this.interpreter.stateStack.slice(0, -1).map(function(state: any){
                        return {start: state.node.start, finish: state.node.end};
                    }));
                } else {
                    this.highlight([]);
                }
            }

            return true;

        } catch (e) {
            onError(e)
            return false;
        }
    }
    deepCopyCreate():JSContext{
        return new JSContext(undefined);
    }
    deepCopyPopulate(copy:JSContext, memo:any, deepcopy:any){
        copy.done = this.done
        if (this.interpreter){
            copy.interpreter = (<any>this.interpreter).copy();
        }
        copy.highlight = this.highlight;
    }
}

export class JSGeneratorContext {
    constructor(script: (e:entity.Entity)=>Generator){
        this.script = script
        this.done = false;
    }
    script: (e:entity.Entity)=>Generator;
    generator: Generator;
    readyCallback: ()=>boolean;
    done: boolean;

    step(e:entity.Ship){
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
