function indent(content: string, n=2): string{
    var lines = content.split('\n');
    return lines.map(function(line){return Array(n).join(' ') + line}).join('\n');
}

class ASTNode {
    constructor(public line: number, public col: number){}
    content: any;
    eval() { throw Error('abstract method')}; // TODO there's probably some nice way to do abstract methods
    tree(): string { throw Error('abstract method'); return '';}; // TODO there's probably some nice way to do abstract methods
}

export class LiteralNumberNode extends ASTNode {
    constructor(line, col, content: string){
        super(line, col);
        this.content = Number(content);
    }
    content: number;
    eval() { return this.content; }
    tree() { return 'NumberLiteral: ' + this.content; }
}

export class NameNode extends ASTNode {
    constructor(line, col, content: string){
        super(line, col);
        this.content = content;
    }
    content: string;
    eval() { throw Error('Name lookup not implemented')};
    tree() { return 'Name: ' + this.content; }
}

export class FunctionNameNode extends NameNode{
    content: string;
    tree() { return 'Function Name: ' + this.content; }
}

export class StringLiteral extends ASTNode {
    eval() { return this.content; }
    tree() { return 'StringLiteral: ' + this.content; }
}

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
    return funccall.eval()
}
console.log(main());
