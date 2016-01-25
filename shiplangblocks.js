function spacesToDashes(target){
  return target.replace(new RegExp(' ', 'g'), '-');
}

function codeZeroIfNaN(num){
  return num === 'NaN' ? '0': num;
}



// To graphically edit blocks, visit https://blockly-demo.appspot.com/static/demos/blockfactory/index.html#umswkp
// with the relevat hash.

// umswkp
Blockly.Blocks['thrustfor'] = {
  init: function() {
    this.appendValueInput("time")
        .setCheck("Number")
        .appendField("thrust for");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(20);
    this.setTooltip('');
    this.setHelpUrl('http://www.example.com/');
  }
};
Blockly.ShipLang['thrustfor'] = function(block) {
  arg = codeZeroIfNaN(Blockly.JavaScript.valueToCode(block, 'time', 1));
  return ' ( thrustFor ' + arg + ' ) ';
};

Blockly.Blocks['turn'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("turn")
        .appendField(new Blockly.FieldDropdown([["↺", "left"], ["↻", "right"]]), "direction");
    this.appendValueInput("time")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("for");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(65);
    this.setTooltip('');
    this.setHelpUrl('http://www.example.com/');
  }
};
Blockly.ShipLang['turn'] = function(block) {
  var dropdown_direction = block.getFieldValue('direction');
  var t = codeZeroIfNaN(Blockly.JavaScript.valueToCode(block, 'time', 1));
  if (dropdown_direction === 'left'){
    return '( leftFor ' + t + ' )';
  } else {
    return '( rightFor ' + t + ' )';
  }
};

Blockly.ShipLang['procedures_defnoreturn'] = function(block) {
  // Define a procedure with a return value.
  var funcName = spacesToDashes(block.getFieldValue('NAME'));
  var branch = Blockly.ShipLang.statementToCode(block, 'STACK') || '()';
  var args = [];
  for (var x = 0; x < block.arguments_.length; x++) {
    args[x] = block.arguments_[x];
  }
  var code = '( defn '+funcName+' (' + args.join(' ') + ') \n' +
      branch + '\n() )';
  code = Blockly.ShipLang.scrub_(block, code);
  return code;
};

Blockly.ShipLang['procedures_defreturn'] = function(block) {
  // Define a procedure with a return value.
  var funcName = spacesToDashes(block.getFieldValue('NAME'));
  var branch = Blockly.ShipLang.statementToCode(block, 'STACK') || '()';
  var args = [];
  for (var x = 0; x < block.arguments_.length; x++) {
    args[x] = block.arguments_[x];
  }
  var code = '( defn '+funcName+' (' + args.join(' ') + ') \n' +
      branch + ')';
  code = Blockly.ShipLang.scrub_(block, code);
  return code;
};

Blockly.Blocks['forever'] = {
  init: function() {
    this.appendStatementInput("body")
        .appendField("forever");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
    this.setTooltip('');
    this.setHelpUrl('http://www.example.com/');
  }
};
Blockly.ShipLang['forever'] = function(block) {
  console.log(block);
  var branch = Blockly.ShipLang.statementToCode(block, 'body') || '()';
  return '( forever\n' + branch + ' ) ';
};

Blockly.ShipLang['math_number'] = function(block) {
  var num = parseFloat(block.getFieldValue('NUM'));
  if (isNaN(num)){
    code = (0).toString();
  } else {
    code = num.toString();
  }
  return code;
};

Blockly.ShipLang['text_print'] = function(block) {
  var argument0 = Blockly.JavaScript.valueToCode(block, 'TEXT',
      Blockly.JavaScript.ORDER_NONE) || '\'\'';
  return '(display ' + argument0 + ' )'
};


Blockly.ShipLang['logic_compare'] = function(block) {
  // Comparison operator.
  var OPERATORS = {
    'EQ': '=',
    'NEQ': '!=',
    'LT': '<',
    'LTE': '<=',
    'GT': '>',
    'GTE': '>='
  };
  var operator = OPERATORS[block.getFieldValue('OP')];
  var order = (operator == '=' || operator == '!=') ?
      Blockly.JavaScript.ORDER_EQUALITY : Blockly.JavaScript.ORDER_RELATIONAL;
  var argument0 = Blockly.JavaScript.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.JavaScript.valueToCode(block, 'B', order) || '0';
  var code = '(' + operator + ' ' + argument0 + ' ' + argument1 + ')';
  return [code, order];
};

