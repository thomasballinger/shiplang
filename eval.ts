class ASTNode {
    constructor(public line: number, public col: number){}
    content: any;
    eval() { throw Error('abstract method')}; // TODO there's probably some nice way to do abstract methods
}

class LiteralNumberNode extends ASTNode {
    constructor(line, col, content: string){
        super(line, col);
        this.content = Number(content);
    }
    content: number;
    eval() { return this.content; }
}

class NameNode extends ASTNode {
    constructor(line, col, content: string){
        super(line, col);
        this.content = content;
    }
    content: string;
    eval() { throw Error('Name lookup not implemented')};
}

class FunctionNameNode extends NameNode{
    content: string;
}

class StringLiteral extends ASTNode {
    eval() { return this.content; }
}

// This time around you can't use expressions in the front position
class FunctionCallNode extends ASTNode {
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
    return funccall.eval()
}
console.log(main());
