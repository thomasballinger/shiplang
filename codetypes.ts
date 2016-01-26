import ev = require('./eval');
import entity = require('./entity');
interface Generator {
    next(): {value: any, done: boolean}
}

export class NOPContext {
    contructor(){
        this.done = true;
    }
    done: boolean;
    step(e:entity.Ship){}
}

export class SLContext {
    constructor(source: string, env: ev.Environment){
        this.source = source;
        this.done = false;
        this.initialEnv = env;
    }
    source: string;
    initialEnv: ev.Environment;
    bytecodeStack: ev.ByteCode[][];
    counterStack: number[];
    envStack: ev.Environment[];
    stack: any[];
    readyCallback: ()=>boolean;
    done: boolean;

    static fromFunction(f: ev.CompiledFunctionObject):SLContext {
        if (f.params.length !== 0){ throw Error('Only functions that take no parameters can be scripts'); }
        var name = f.name || 'anonymous function';
        var context = new SLContext(name, undefined);
        context.bytecodeStack = <ev.ByteCode[][]>[f.code];
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
}

export class JSContext {
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
