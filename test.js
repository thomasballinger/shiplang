var evaluation = require('./built/eval.js');

var assert = require('chai').assert;

describe("eval", function() {
  it("should run addition", function(){
    var one = new evaluation.LiteralNumberNode(1, 4, '1');
    var two = new evaluation.LiteralNumberNode(1, 6, '2');
    var plus = new evaluation.FunctionNameNode(1, 2, '+');
    var funccall = new evaluation.FunctionCallNode(1, 1, plus, [one, two]);
    assert.equal(funccall.eval(), 3);
  });
});
