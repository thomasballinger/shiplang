
enum BC {
    LoadConstant,
    FunctionLookup,
    FunctionCall,
    NameLookup,
    JumpIfNot,
    Jump,
    Pop,            // arg always null
    BuildFunction, // arg is null for lambda, name otherwise
    Push,
}
type ByteCode = [BC, any];

import PEG = require('pegjs')

var grammar = `
{
    function ein(s){ // empty string if null
        if (Array.isArray(s)){
            s = s.join('');
        }
        return s === null ? '' : s;
    }
    function makeFunctionCallNode(funcName, spacesAndAtoms){
        var nodes = spacesAndAtoms.map(function(x){return x[1];});
        return new parser.nodes.FunctionCallNode(location(), funcName, nodes);
    }
    function doIfMultipleStatements(location, sexps){
        if (sexps.length === 1){
            return sexps[0];
        } else {
            return new parser.nodes.DoNode(location, sexps);
        }
    }
}

start
  = module

module
  = _* head:sexp wsNoNewline* rest:('\\n' _* sexp)* _* { return doIfMultipleStatements(location(), [head].concat(rest.map(function(x){return x[2];}))); }

sexp
  = "(" _+ ")" { return new parser.node.NullNode(location()) }
  / ifSexp
  / doSexp
  / lambdaSexp
  / functionCallSexp
  / atom

ifSexp
  = "(" _* "if" _+ cond:sexp _+ ifTrue:sexp _*")" { return new parser.nodes.IfNode(location(), cond, ifTrue); }
  / "(" _* "if" _+ cond:sexp _+ ifTrue:sexp _+ ifFalse:sexp _* ")" { return new parser.nodes.IfNode(location(), cond, ifTrue, ifFalse); }

doSexp
  = "(" _* "do" sexps:(_+ sexp)* _* ")" { return new parser.nodes.DoNode(location(), sexps.map(function(x){return x[1]})); }

lambdaSexp
  = "(" _* "lambda" _* params:functionParams _* head:sexp _* rest:(_* sexp)* _* ")" { return new parser.nodes.LambdaNode(location(), params, doIfMultipleStatements(location(), [head].concat(rest.map(function(x){return x[1];})))); }

functionParams
  = "(" params:(_* atom)* _* ")" { return params.map(function(x){return x[1].content}); }

functionCallSexp =
  "(" _* funcName:functionName sexps:(_* sexp)* _* ")" { return makeFunctionCallNode(funcName, sexps); }

functionName
  = name:identifier {return new parser.nodes.FunctionNameNode(location(), name.content); }

atom
  = literal
  / identifier

identifier
  = name:([a-zA-Z0-9-+*/!$%&*+-/:<=>?@^_~]+) { return new parser.nodes.NameNode(location(), name.join('')); }

literal
  = number
  / string

string
  = '"' value:([^"])+ '"' { return new parser.nodes.StringLiteralNode(value.join('')); }
  / "'" value:[^']+ "'" { return new parser.nodes.StringLiteralNode(value.join('')); }

number
 = unary:[+-]? before:[0-9]* decimal:'.'? after:[0-9]+ { return new parser.nodes.NumberLiteralNode(location(), ein(unary)+ein(before)+ein(decimal)+ein(after)); }
 / unary:[+-]? before:[0-9]+ decimal:'.'? after:[0-9]* { return new parser.nodes.NumberLiteralNode(location(), ein(unary)+ein(before)+ein(decimal)+ein(after)); }

_
  = [ \\t\\r\\n]

wsNoNewline
  = [ \\t]
`

function enumLookup(enumObj, value){
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

function range(n){
    return Array.apply(null, Array(n)).map(function (_, i) {return i;});
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
    constructor(location){
        this.content = null;
        super(location)
    }
    eval(env: Environment) { return null; }
    tree() { return 'NullLiteral: ' + this.content; }
    compile(): Array<ByteCode> { return [[BC.LoadConstant, null]];};
}

class NumberLiteralNode extends ASTNode {
    constructor(location, content: string){
        super(location);
        this.content = Number(content);
    }
    content: number;
    eval(env) { return this.content; }
    tree() { return 'NumberLiteral: ' + this.content; }
    compile(): Array<ByteCode> { return [[BC.LoadConstant, this.content]]; }
}

class NameNode extends ASTNode {
    constructor(location, content: string){
        super(location);
        this.content = content;
    }
    content: string;
    eval(env) { return env.lookup(this.content) };
    tree() { return 'Name: ' + this.content; }
    compile(): Array<ByteCode> { return [[BC.NameLookup, 0]]; }
}

class FunctionNameNode extends NameNode{
    content: string;
    eval(env) { return env.lookup(this.content); }
    tree() { return 'Function Name: ' + this.content; }
    compile(): Array<ByteCode> { return [[BC.FunctionLookup, this.content]]; }
}

class StringLiteralNode extends NameNode {
    eval(env) { return this.content; }
    tree() { return 'StringLiteral: ' + this.content; }
    compile(): Array<ByteCode> { return [[BC.LoadConstant, this.content]]; } }

// This time around you can't use expressions in the front position
class FunctionCallNode extends ASTNode {
    constructor(location,
                public head: FunctionNameNode, public args: ASTNode[]){
        super(location);
    }
    get content(): ASTNode[]{
        return (<ASTNode[]>[this.head]).concat(this.args);
    }
    eval(env) {
        var func = this.head.eval(env);
        var argValues = this.args.map(function(node){return node.eval(env)});
        console
        return func.apply(null, argValues);
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
    eval(env) {
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
    eval(env) {
        var result = undefined;
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

class CompiledFunctionObject {
    constructor(public params: string[], public body: ASTNode, public env: Environment){}
}

class FunctionObject {
    constructor(public params, public body, public env){
        this.params = params;
        this.body = body;
        this.env = env.copy();
    }
    apply(args: any[]){
        var scope = {};
        args.map(function(x, i){
            scope[this.params[i]] = x;
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
    eval(env) {
        return new FunctionObject(this.params, this.body, env);
    }
    tree() { return ("lambda with params (" + this.params + ")" +
                     "\n" + indent(this.body.tree())); }
    compile() {
        return <Array<ByteCode>>[
            [BC.Push, this.body.compile()],
            [BC.Push, this.params],
            [BC.BuildFunction, null]];
    }
}

class Environment {
    constructor(public scopes: Array<any>){ }
    lookup(name: string){
        for (var scope of this.scopes){
            if (scope.hasOwnProperty(name)){
                return scope[name];
            }
        }
        var scopeReprs = this.scopes.map(function(scope){
            return ''+Object.keys(scope);
        }).join('\n');
        throw Error("Name '"+name+"' not found in scopes:\n"+scopeReprs);
    }
    // create a new environment with same scopes as this one, plus
    // an additional provided scope
    copy(s: any): Environment{
        return new Environment(this.scopes.slice(0));
    }
}
var emptyEnv = new Environment([]);


var parser = PEG.buildParser(grammar);
parser.nodes = {}
parser.nodes.NumberLiteralNode = NumberLiteralNode;
parser.nodes.StringLiteralNode = StringLiteralNode;
parser.nodes.FunctionNameNode = FunctionNameNode;
parser.nodes.NameNode = NameNode;
parser.nodes.FunctionCallNode = FunctionCallNode;
parser.nodes.IfNode = IfNode;
parser.nodes.DoNode = DoNode;
parser.nodes.LambdaNode = LambdaNode;

function runBytecode(bytecode: ByteCode[], env: Environment){
    var toRun = bytecode;
    var stack = [];
    var counter = 0;
    while (true){
        if (counter >= toRun.length){ break; }
        var [bc, arg] = toRun[counter];
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
                stack.push(func.apply(null, args));
                break;
            case BC.JumpIfNot:
                var cond = stack.pop();
                if (!cond) {
                    counter += arg;
                }
                break;
            case BC.Jump:
                counter += arg;
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
                    throw Error('named functions not implemented yet');
                }
                break;
            case BC.Push:
                stack.push(arg);
                break;
            default:
                throw Error('unrecognized bytecode: '+bc+' enumLookup:'+enumLookup(BC, bc));
        }
        counter++;
    }
    return stack.pop();
}

var funcs = {
    '+': function(){
      return Array.prototype.slice.call(arguments).reduce(function(a, b){
        return a + b;
      }, 0);
    },
    '*': function(a, b){ return a * b; },
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
    var compiledResult = runBytecode(bytecode, env);
    if (interpResult !== compiledResult){
        throw Error('interpreted result '+interpResult+' differs from compiled result '+compiledResult);
    }
    return compiledResult;
}

export function trace(code: string){
    console.log(code);
    try {
        var ast = parser.parse(code);
    } catch (e) {
        console.log(e)
        return
    }
    console.log('AST:');
    console.log(indent(ast.tree()));
    var bytecode = ast.compile();
    console.log('bytecode:');
    //console.log(bytecode);
    dis(bytecode, 2);
    var env = new Environment([Object.assign({}, funcs), {}])
    console.log('interpreted result:', ast.eval(env));
    var env = new Environment([Object.assign({}, funcs), {}])
    console.log('compiled result:', runBytecode(bytecode, env));
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
trace(`((lambda (x y) (+ 1 2) (+ 3 4))`)
