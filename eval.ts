
export enum BC {
    LoadConstant,
    FunctionLookup,
    FunctionCall,
    NameLookup,
    JumpIfNot,
    Jump,
    Pop,           // arg always null
    BuildFunction, // arg is null for lambda, name otherwise
    Push,
    StoreNew,      // arg is variable name, saves TOS
    Store,         // arg is variable name, saves TOS
    Return,        // done with this bytecode
    Yield,         // done for now, please continue when callback is true
}
export type ByteCode = [BC, any];
interface Scope {
  [key: string]: any;
}

import PEG = require('pegjs');

if (process.pid !== undefined){
    // when run from node (I hope?)
    var fs = require('fs');
    var grammar = fs.readFileSync('./shiplang.grammar', 'utf8');
} else { // webpack will use a loader
    var grammar = require('./shiplang.grammar');
}

function enumLookup(enumObj: any, value: number){
    for (var name in enumObj){
        if (enumObj[name] == value){
            return name;
        }
    }
}

function indent(content: string, n=2): string{
    var lines = content.split('\n');
    return lines.map(function(line){return Array(n).join(' ') + line}).join('\n');
}

function range(n: number){
    return Array.apply(null, Array(n)).map(function (_:any, i:number) {return i;});
}

interface Location {
  start: { offset: number, line: number, column: number },
  end:   { offset: number, line: number, column: number }
}
var noLocation = {
  start: { offset: 0, line: 1, column: 1 },
  end:   { offset: 0, line: 1, column: 1 }
}

abstract class ASTNode {
    constructor(public location: Location){}
    content: any;
    abstract eval(env: Environment): any;
    abstract tree(): string;
    abstract compile(): Array<ByteCode>;
}

class NullNode extends ASTNode {
    constructor(location: Location){
        this.content = null;
        super(location)
    }
    eval(env: Environment):any { return null; }
    tree() { return 'NullLiteral: ' + this.content; }
    compile(): Array<ByteCode> { return [[BC.LoadConstant, null]];};
}

class NumberLiteralNode extends ASTNode {
    constructor(location: Location, content: string){
        super(location);
        this.content = Number(content);
    }
    content: number;
    eval(env: Environment):any { return this.content; }
    tree() { return 'NumberLiteral: ' + this.content; }
    compile(): Array<ByteCode> { return [[BC.LoadConstant, this.content]]; }
}

class NameNode extends ASTNode {
    constructor(location: Location, content: string){
        super(location);
        this.content = content;
    }
    content: string;
    eval(env: Environment):any { return env.lookup(this.content) };
    tree() { return 'Name: ' + this.content; }
    compile(): Array<ByteCode> { return [[BC.NameLookup, this.content]]; }
}

class FunctionNameNode extends NameNode{
    content: string;
    eval(env: Environment):any { return env.lookup(this.content); }
    tree() { return 'Function Name: ' + this.content; }
    compile(): Array<ByteCode> { return [[BC.FunctionLookup, this.content]]; }
}

class StringLiteralNode extends NameNode {
    eval(env: Environment):any { return this.content; }
    tree() { return 'StringLiteral: ' + this.content; }
    compile(): Array<ByteCode> { return [[BC.LoadConstant, this.content]]; } }

// This time around you can't use expressions in the front position
class FunctionCallNode extends ASTNode {
    constructor(location: Location,
                public head: FunctionNameNode, public args: ASTNode[]){
        super(location);
    }
    get content(): ASTNode[]{
        return (<ASTNode[]>[this.head]).concat(this.args);
    }
    eval(env: Environment):any {
        var func = this.head.eval(env);
        var argValues = this.args.map(function(node){return node.eval(env)});
        if (typeof func === 'function'){
            return func.apply(null, argValues);
        } else {
            return func.run(argValues);
        }
    }
    tree() {
        return ('Func call with '+this.head.tree() +
                '\n'+this.args.map(function(x: ASTNode){
                    return indent(x.tree())
                }).join('\n'));
    }
    compile() {
        var loadfunc = this.head.compile();
        var loadargs = [].concat.apply([], this.args.map(function(x: ASTNode){ return x.compile()}));
        return [].concat(loadfunc, loadargs, [[BC.FunctionCall, this.args.length]]);
    }
}

class DefineNode extends ASTNode {
    constructor(location: Location,
                public name: string, public value: ASTNode){
        super(location);
    }
    eval(env: Environment):any{
        var v = this.value.eval(env);
        env.define(this.name, v);
        return v;
    }
    tree(){
        return 'define\n '+this.value+' to be\n'+indent(this.value.tree(), 1);
    }
    compile(){
        return [].concat(this.value.compile(), [[BC.StoreNew, this.name]]);
    }
}

class YieldNode extends ASTNode {
    constructor(location: Location, public content: ASTNode){ super(location); }
    eval(env: Environment){
        var value = this.content.eval(env)
        console.log('yielded:', value);
        return value;
    }
    tree() { return 'yield ' + this.content.tree(); }
    compile(): ByteCode[] { return [].concat(this.content.compile(), [[BC.Yield, null]]) }
}

class IfNode extends ASTNode {
    constructor(location: Location,
                public condition: ASTNode, public ifTrue: ASTNode, public ifFalse?: ASTNode){
        super(location);
    }
    get content(): ASTNode[]{
        if (this.ifFalse === undefined){
            return [].concat(this.condition, this.ifTrue);
        } else {
            return [].concat(this.condition, this.ifTrue, this.ifFalse);
        }
    }
    eval(env: Environment):any {
        var cond = this.condition.eval(env);
        if (cond){
            return this.ifTrue.eval(env);
        } else if (this.ifFalse !== undefined){
            return this.ifFalse.eval(env);
        } else {
            return undefined;
        }
    }
    tree() {
        return ('if\n' + indent(this.condition.tree()) + '\nthen\n' + indent(this.ifTrue.tree()) +
                (this.ifFalse === undefined ? '' : '\nelse\n'+indent(this.ifFalse.tree())));
    }
    compile(): Array<ByteCode> {
        var condition = this.condition.compile();
        var ifTrue = this.ifTrue.compile();
        var ifFalse = this.ifFalse === undefined ? [] : this.ifFalse.compile();
        var skipFalse = this.ifFalse === undefined ? [] : [[BC.Jump, ifFalse.length]];
        return [].concat(condition, [[BC.JumpIfNot, ifTrue.length+skipFalse.length]],
                         ifTrue, skipFalse, ifFalse);
    }
}

class DoNode extends ASTNode {
    constructor(location: Location,
                public content: ASTNode[]){
                    super(location);
                }
    eval(env: Environment):any {
        var result = <any>undefined;
        this.content.map(function(x){ result = x.eval(env);});
        return result;
    }
    tree() { return ('Do\n' +
                     this.content.map(function(x: ASTNode){
                        return indent(x.tree())
                     }).join('\n'));
    }
    compile() {
        var code = <Array<ByteCode>>[];
        for (var node of this.content){
            code = code.concat(node.compile())
            code.push([BC.Pop, null]);
        }
        code.pop(); // last value shouldn't be cleared
        return code;
    }
}

class ForeverNode extends ASTNode {
    constructor(location: Location,
               public content: ASTNode){
                   super(location);
               }
    eval(env: Environment) {
        while (true){
            this.content.eval(env);
        }
    }
    tree() { return 'Forever\n' + indent(this.content.tree()); }
    compile():ByteCode[] {
        var code = this.content.compile();
        code.push([BC.Pop, null]);
        code.push([BC.Jump, -(code.length+1)])
        return code;
    }
}

class CompiledFunctionObject {
    constructor(public params: string[], public code: ByteCode[], public env: Environment){}
}

class FunctionObject {
    constructor(public params: string[], public body: ASTNode, public env: Environment){
        this.params = params;
        this.body = body;
        this.env = env.copy();
    }
    run(args: any[]){
        var scope = <Scope>{};
        if (args.length !== this.params.length){
            throw Error('Function called with wrong arity! Takes ' +
                         this.params.length + ' args, given ' + args.length);
        }
        var params = this.params;
        args.map(function(x, i){
            scope[params[i]] = x;
        });
        var env = this.env.copy();
        env.scopes.push(scope);
        return this.body.eval(env);
    }
}

class LambdaNode extends ASTNode {
    constructor(location: Location,
                public params: string[],
                public body: ASTNode){
                    super(location);
                }
    get content(): any[]{
        return [this.params, this.body];
    }
    eval(env: Environment):any {
        return new FunctionObject(this.params, this.body, env);
    }
    tree() { return ("lambda with params (" + this.params + ")" +
                     "\n" + indent(this.body.tree())); }
    compile() {
        var code = this.body.compile()
        code.push([BC.Return, null]);
        return <Array<ByteCode>>[
            [BC.Push, code],
            [BC.Push, this.params],
            [BC.BuildFunction, null]];
    }
}

class DefnNode extends ASTNode {
    constructor(location: Location,
                public name: string,
                public params: string[],
                public body: ASTNode){
                    super(location);
                }
    get content(): any[]{
        return [this.name, this.params, this.body];
    }
    eval(env: Environment):any {
        var func = new FunctionObject(this.params, this.body, env);
        env.define(this.name, func);
        return func;
    }
    tree() { return ("lambda with params (" + this.params + ")" +
                     "\n" + indent(this.body.tree())); }
    compile() {
        var code = this.body.compile()
        code.push([BC.Return, null]);
        return <Array<ByteCode>>[
            [BC.Push, code],
            [BC.Push, this.params],
            [BC.BuildFunction, this.name],
            [BC.StoreNew, this.name]
        ];
    }
}

export class Environment {
    constructor(public scopes: Array<any>){ }
    lookup(name: string){
        for (var i = this.scopes.length - 1; i >= 0; i--){
            var scope = this.scopes[i];
            var val = scope[name];
            if (val !== undefined){
                if (typeof val === 'function'){
                    return function wrapper(){
                        return val.apply(scope, arguments);
                    }
                }
                return val;
            }
        }

        var scopeReprs = this.scopes.map(function(scope){
            return ''+Object.keys(scope);
        }).join('\n');
        throw Error("Name '"+name+"' not found in scopes:\n"+scopeReprs);
    }
    define(name: string, value: any){
        this.scopes[this.scopes.length-1][name] = value;
    }

    // create a new environment with same scopes as this one, plus
    // an additional provided scope
    copy(): Environment{
        return new Environment(this.scopes.slice(0));
    }
}
var emptyEnv = new Environment([]);


export var parser = PEG.buildParser(grammar);
parser.nodes = {}
parser.nodes.NumberLiteralNode = NumberLiteralNode;
parser.nodes.StringLiteralNode = StringLiteralNode;
parser.nodes.FunctionNameNode = FunctionNameNode;
parser.nodes.NameNode = NameNode;
parser.nodes.FunctionCallNode = FunctionCallNode;
parser.nodes.IfNode = IfNode;
parser.nodes.DoNode = DoNode;
parser.nodes.LambdaNode = LambdaNode;
parser.nodes.DefineNode = DefineNode;
parser.nodes.YieldNode = YieldNode;
parser.nodes.DefnNode = DefnNode;

export function runBytecodeOneStep(counterStack: number[], bytecodeStack: ByteCode[][],
                            stack: any[], envStack: Environment[]){
    //console.log('bytecodeStack:', bytecodeStack);
    //console.log('counterStack:', counterStack);
    //console.log('stack:', stack);
    if (bytecodeStack.length === 0){ throw Error('No bytecode to run!'); }
    if (counterStack.length === 0){ throw Error('No indexes!'); }
    if (counterStack.length !== bytecodeStack.length){
        throw Error('bytecodeStack and counterStack must be same length!');
    }
    if (bytecodeStack.length !== envStack.length){
        throw Error('bytecodeStack and envStack must be same length!');
    }
    var bytecode = bytecodeStack[bytecodeStack.length-1];
    var env = envStack[envStack.length-1];
    if (bytecode.length <= counterStack[counterStack.length-1]){
        throw Error('counter went off the end of bytecode: missing return?')
    }
    var [bc, arg] = bytecode[counterStack[counterStack.length-1]];
    switch (bc){
        case BC.LoadConstant:
            stack.push(arg)
            break;
        case BC.FunctionLookup:
            stack.push(env.lookup(arg));
            break;
        case BC.NameLookup:
            stack.push(env.lookup(arg));
            break;
        case BC.FunctionCall:
            var args = range(arg).map(function(){return stack.pop();});
            var func = stack.pop();
            if (typeof func === 'function'){
                var result = func.apply(null, args);
                if (func.requiresYield){
                    // Then yield, but first replace this function
                    // on the stack with a wrapped version that doesn't
                    // have .requiresYield set to true on it so that
                    // upon resuming the function will be called normally.
                    function wrapper(){
                        return func.apply(null, arguments);
                    }
                    stack.push(result);
                    return func.isReady() // this should produce the isReady function
                }
            } else {
                if (func.params.length !== arg){
                    throw Error('Function called with wrong arity! Takes ' +
                                func.params.length + ' args, given ' + args.length);
                }
                var scope = <Scope>{};
                args.map(function(x:any, i:number){ //TODO why is this necessary?
                    scope[func.params[i]] = x;
                }); // TODO factor out creating a new environment
                var newEnv = env.copy();
                newEnv.scopes.push(scope);
                bytecodeStack.push(func.code);
                counterStack.push(0);
                envStack.push(newEnv);
                return; // to skip incrementing the counter, because it's
                        // now the wrong counter that would be incremented
            }
            break;
        case BC.Return:
            bytecodeStack.pop();
            counterStack.pop();
            envStack.pop();
            if (bytecodeStack.length === 0){
                return 'done';
            }
            break;
        case BC.Yield:
            var callback = stack[stack.length-1];
            counterStack[counterStack.length-1]++;
            return callback;
            break;
        case BC.JumpIfNot:
            var cond = stack.pop();
            if (!cond) {
                counterStack[counterStack.length-1] += arg;
            }
            break;
        case BC.Jump:
            counterStack[counterStack.length-1] += arg;
            break;
        case BC.Pop:
            if (arg !== null){
                throw Error('argument to pop should always be null, was '+arg);
            }
            stack.pop();
            break
        case BC.BuildFunction:
            var name = arg;
            var params = stack.pop();
            var code = stack.pop();
            stack.push(new CompiledFunctionObject(params, code, env));
            if (arg === null){ // lambda function
            } else {
                //TODO when named functions are treated specially
            }
            break;
        case BC.Push:
            stack.push(arg);
            break;
        case BC.StoreNew:
            env.define(arg, stack[stack.length-1]);
            break;
        default:
            throw Error('unrecognized bytecode: '+bc+' enumLookup:'+enumLookup(BC, bc));
    }
    counterStack[counterStack.length-1]++;
}

export function initialize(code: string, env: Environment): [ByteCode[][], number[], Environment[], any[]]{
    var ast = parser.parse(code);
    var bytecode = ast.compile();
    bytecode.push([BC.Return, null]) // add a last thing to do: return result
    var bytecodeStack = <ByteCode[][]>[bytecode];
    var stack = <any[]>[];
    var counterStack = [0];
    var envStack = [env];
    return [bytecodeStack, counterStack, envStack, stack];
}

// default behavior for yieldCallback is to return the yielded callback
function runBytecode(bytecode: ByteCode[], env: Environment, yieldCallback?: (isready:()=>boolean)=>any){
    bytecode.push([BC.Return, null]) // last thing to do: return result
    var bytecodeStack = <ByteCode[][]>[bytecode];
    var stack = <any[]>[];
    var counterStack = [0];
    var envStack = [env];
    while (true){
        var result = runBytecodeOneStep(counterStack, bytecodeStack, stack, envStack);
        if (result === undefined ){ continue; }
        else if (result === 'done'){ break; }
        else if (yieldCallback === undefined){
            return result;
        } else {
            yieldCallback(result)
        }
    }
    if (stack.length !== 1){
        throw Error('final stack is of wrong length '+stack.length+': '+stack)
    }
    return stack.pop();
}

var funcs = {
    '+': function(){
      return Array.prototype.slice.call(arguments).reduce(function(a:number, b:number){
        return a + b;
      }, 0);
    },
    '*': function(a:number, b:number){ return a * b; },
}

export function dis(bytecode: ByteCode[], indent=0){
    bytecode.map(function(x){
        console.log(Array(indent).join(' ') + enumLookup(BC, x[0]), x[1]);
    })
}

export function run(code: string){
    var ast = parser.parse(code);
    var bytecode = ast.compile();
    var env = new Environment([Object.assign({}, funcs), {}])
    var interpResult = ast.eval(env);
    var env = new Environment([Object.assign({}, funcs), {}])
    var compiledResult = runBytecode(bytecode, env, function(x){console.log('yielded:', x)});
    if (interpResult !== compiledResult){
        throw Error('interpreted result '+interpResult+' differs from compiled result '+compiledResult);
    }
    return compiledResult;
}


// Interactive Sessions with persistent state
abstract class Session{
    constructor(){ this.env = new Environment([Object.assign({}, funcs), {}]); }
    abstract run(s: string):any
    env: Environment;
}
export class InterpreterSession extends Session{
    run(s: string){
        var ast = parseOrShowError(s)
        if (ast === undefined) { return }
        try {
            return ast.eval(this.env);
        } catch (e) {
            console.log(e);
        }
    }
}
export class CompilerSession extends Session{
    run(s: string){
        var ast = parseOrShowError(s)
        if (ast === undefined){ return }
        var code = ast.compile();
        try {
            return runBytecode(code, this.env, function(x){console.log('yielded:', x);});
        } catch (e) {
            console.log(e);
        }
    }
}
export class TraceSession extends Session{
    constructor(){
        this.envInterp = new Environment([Object.assign({}, funcs), {}]);
        super();
    }
    envInterp: Environment;
    run(s: string){
        var ast = parseOrShowError(s)
        if (ast === undefined){ return }
        console.log('AST:');
        console.log(indent(ast.tree()));
        try {
            console.log('interpreted result:', ast.eval(this.envInterp));
        } catch (e) {
            console.log(e);
        }
        var code = ast.compile();
        console.log('bytecode:');
        dis(code, 2);
        try {
            return runBytecode(code, this.env);
        } catch (e) {
            console.log(e);
        }
    }
}
export function parseOrShowError(s: string){
    try {
        return parser.parse(s);
    } catch (e) {
        console.log(e)
    }
}

// testing
export function trace(code: string, env=<Environment>undefined){
    if (env === undefined){
        var envCompiled = new Environment([Object.assign({}, funcs), {}])
        var envInterp = new Environment([Object.assign({}, funcs), {}])
    } else {
        var envCompiled = env.copy();
        var envInterp = env.copy(); // TODO this will still bleed over
    }
    var ast = parseOrShowError(code);
    console.log('AST:');
    console.log(indent(ast.tree()));
    var bytecode = ast.compile();
    console.log('bytecode:');
    dis(bytecode, 2);
    console.log('interpreted result:', ast.eval(envInterp));
    var compiledResult = runBytecode(bytecode, envCompiled)
    console.log('compiled result:', compiledResult);
    return compiledResult;
}

function main(){
    '(+ 1 2)'
    var one = new NumberLiteralNode(noLocation, '1');
    var two = new NumberLiteralNode(noLocation, '2');
    var plus = new FunctionNameNode(noLocation, '+');
    var funccall = new FunctionCallNode(noLocation, plus, [one, two]);
    console.log(funccall.tree())
    console.log(funccall.compile())
    dis(funccall.compile())
    var env = new Environment([Object.assign({}, funcs), {}])
    console.log(runBytecode(funccall.compile(), env));
    console.log(parser.parse('(1 2 3)'));
    console.log(parser.parse(`(1 2 3)

                              (2 3 4)`));
    var env = new Environment([Object.assign({}, funcs), {}])
    return funccall.eval(env)
}
//trace('(+ 1 2)');
//trace('(if 1 2 3)');
//trace(`(if 1 (do 3 4) (do 1 2))`);

//trace('50.0');
//trace(`(+ 1 (if 3 4 50))`);
//trace(`(do (+ 1 (if 3 4 50)))`);
//trace(`(do (+ 1 (if 3 4 50)))`);
//trace(`((lambda (x y) (+ 1 2) (+ 3 4))`)
//trace(`(define a 1)
//       a`)
//trace(`(define a (lambda (x y) (+ x y)))
//       (a 1 2)`)
//trace(`(define a (lambda (x y) 1 2 (+ x y)))
//      (a 2 3)`);
