import ev = require('./eval');

export var InterpreterSession = ev.InterpreterSession
export var CompilerSession = ev.CompilerSession
export var TraceSession = ev.TraceSession

interface Generator {
    next: {value: any, done: boolean}
}

type Context = [string, ev.ByteCode[][], number[], ev.Environment[], any[], ()=>boolean];

// A Scheduler holds multiple running threads.
// It can run all scripts to the next tick.
// It can run JavaScript generators and shiplang scripts.
class Scheduler{
    constructor(){
        this.contexts = [];
        this.generators = [];
    }
    contexts: Context[];
    generators: [Generator, ()=>boolean][];
    addScript(code: string, env: ev.Environment){
        var [bytecodeStack, counterStack, envStack, stack] = ev.initialize(code, env);
        var ast = ev.parser.parse(code);
        var bytecode = ast.compile()
        bytecode.push([ev.BC.Return, null]) // last thing to do: return result
        var bytecodeStack = <ev.ByteCode[][]>[bytecode];
        this.contexts.push([code, bytecodeStack, counterStack, envStack, stack, undefined])
    }
    addJS(generator:Generator){
        this.generators.push([generator, undefined])
    }
    tick(){ //TODO do this in discrete steps
        var newContexts = <Context[]>[];
        for (var [src, bcs, cs, es, stack, isReady] of this.contexts){
            if (isReady !== undefined && !isReady()){
                newContexts.push([src, bcs, cs, es, stack, isReady]);
                continue;
            }
            while (true) {
                var result = ev.runBytecodeOneStep(cs, bcs, stack, es);
                if (result === undefined) {
                    continue;
                } else if (result === 'done'){
                    console.log('script complete');
                    break;
                } else {
                    newContexts.push([src, bcs, cs, es, stack, result])
                    break;
                }
            }
        }
        this.contexts = newContexts
        //for (var [gen, isReady] of this.generators){
        //}
    }
}

function main(){
    var abc = false;
    var funs = {waitForAbc: function(){ return abc; },
                display: function(x:any){console.log(x)}
    }

    var script = `(display 1)
    (display 2)
    (yield waitForAbc)
    (display 3)
    (display 4)
    5
    `
    if (ev.parseOrShowError(script) === undefined){ return; }
    var env = new ev.Environment([funs, {}]);

    var s = new Scheduler();
    s.addScript(script, env)
    console.log(s);
    s.tick()
    s.tick()
    abc = true;
    s.tick()
    console.log(s);
}

main();
