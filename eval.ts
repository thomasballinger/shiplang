enum BC {
    LoadConstant,
    FunctionLookup,
    FunctionCall,
}

type ByteCode = [BC, any];

function enumLookup(enumObj, value){
    for (var name in enumObj){
        if (enumObj[name] == value){
            return name;
        }
    }
}

function dis(bytecode: ByteCode[]){
    bytecode.map(function(x){
        console.log(enumLookup(BC, x[0]), x[1]);
    })
}

function indent(content: string, n=2): string{
    var lines = content.split('\n');
    return lines.map(function(line){return Array(n).join(' ') + line}).join('\n');
}

function range(n){
    return Array.apply(null, Array(n)).map(function (_, i) {return i;});
}

class ASTNode {
    constructor(public line: number, public col: number){}
    content: any;
    eval() { throw Error('abstract method')}; // TODO there's probably some nice way to do abstract methods
    tree(): string { throw Error('abstract method'); return '';}; // TODO there's probably some nice way to do abstract methods
    compile(): Array<ByteCode> { throw Error('abstract method'); return [[BC.LoadConstant, 'should be abstract']];};
}

export class LiteralNumberNode extends ASTNode {
    constructor(line, col, content: string){
        super(line, col);
        this.content = Number(content);
    }
    content: number;
    eval() { return this.content; }
    tree() { return 'NumberLiteral: ' + this.content; }
    compile(): Array<ByteCode> { return [[BC.LoadConstant, this.content]]; }
}

export class NameNode extends ASTNode {
    constructor(line, col, content: string){
        super(line, col);
        this.content = content;
    }
    content: string;
    eval() { throw Error('Name lookup not implemented')};
    tree() { return 'Name: ' + this.content; }
    compile() { throw Error('TODO'); return []; } //TODO
}

export class FunctionNameNode extends NameNode{
    content: string;
    tree() { return 'Function Name: ' + this.content; }
    compile() { return [[BC.FunctionLookup, this.content]]; }
}

export class StringLiteral extends ASTNode {
    eval() { return this.content; }
    tree() { return 'StringLiteral: ' + this.content; }
    compile(): Array<ByteCode> { return [[BC.LoadConstant, this.eval()]]; } }

// This time around you can't use expressions in the front position
export class FunctionCallNode extends ASTNode {
    constructor(public line: number, public col: number,
                public head: FunctionNameNode, public args: ASTNode[]){
        super(line, col);
    }
    get content(): ASTNode[]{
        return (<ASTNode[]>[this.head]).concat(this.args);
    }
    eval() {
        var func = funcs[this.head.content];
        var argValues = this.args.map(function(node){return node.eval()});
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
        console.log('loadargs', loadargs);
        return [].concat(loadfunc, loadargs, [[BC.FunctionCall, loadargs.length]]);
    }
}

export class IfNode extends ASTNode {
    constructor(public line: number, public col: number,
                public condition: ASTNode, public ifTrue: ASTNode, public ifFalse?: ASTNode){
        super(line, col);
    }
    get content(): ASTNode[]{
        if (this.ifFalse === undefined){
            return [].concat(this.condition, this.ifTrue);
        } else {
            return [].concat(this.condition, this.ifTrue, this.ifFalse);
        }
    }
    eval() {
        var cond = this.condition.eval();
        if (cond){
            return this.ifTrue.eval();
        } else if (this.ifFalse !== undefined){
            return this.ifFalse.eval();
        } else {
            return undefined;
        }
    }
    tree() {
        return ('if\n' + indent(this.condition.tree()) + '\nthen\n' + indent(this.ifTrue.tree()) +
                (this.ifFalse === undefined ? '' : 'else\n'+indent(this.ifFalse.tree())));
    }
}

export class Do extends ASTNode {
    constructor(public line: number, public col: number,
                public content: ASTNode[]){
                    super(line, col);
                }
    eval() {
        var result = undefined;
        this.content.map(function(x){ result = x.eval();});
        return result;
    }

}

function runBytecode(bytecode: ByteCode[]){
    var toRun = bytecode.slice();
    var stack = [];
    while (toRun.length > 0){
        var [bc, arg] = toRun.shift();
        switch (bc){
            case BC.LoadConstant:
                stack.push(arg)
                break;
            case BC.FunctionLookup:
                stack.push(funcs[arg])
                break;
            case BC.FunctionCall:
                var args = range(arg).map(function(){return stack.pop();});
                var func = stack.pop()
                // TODO allow lambdas here instead
                stack.push(func.apply(null, args));
                break;
            default:
                throw Error('unrecognized bytecode: '+bc);
        }
    }
    console.log('runBytecode finished with stack of:', stack);
}

var funcs = {
    '+': function(){
      return Array.prototype.slice.call(arguments).reduce(function(a, b){
        return a + b;
      }, 0);
    },
    '*': function(a, b){ return a * b; },
}

function main(){
    '(+ 1 2)'
    var one = new LiteralNumberNode(1, 4, '1');
    var two = new LiteralNumberNode(1, 6, '2');
    var plus = new FunctionNameNode(1, 2, '+');
    var funccall = new FunctionCallNode(1, 1, plus, [one, two]);
    console.log(funccall.tree())
    console.log(funccall.compile())
    dis(funccall.compile())
    console.log(runBytecode(funccall.compile()));
    return funccall.eval()
}
console.log(main());
