'use strict';

var Blockly = window.Blockly;

Blockly.ShipLang = new Blockly.Generator('ShipLang');

Blockly.ShipLang.addReservedWords('thisisarservedword,soisthis');

// no order of operation necessary b/c LISP!

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.ShipLang.init = function(workspace) {
  //console.log('init being called with', arguments);
};
Blockly.ShipLang.finish = function(code) {
  //console.log('finish being called with', arguments);
  return arguments[0];
};

Blockly.ShipLang.scrub_ = function(block, code){
  //console.log('scrub_ being called with', arguments);
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = Blockly.ShipLang.blockToCode(nextBlock);
  return code +'\n'+ nextCode;
};

Blockly.ShipLang.workspaceToCode = function(workspace) {
  var code = [];
  var blocks = workspace.getTopBlocks(true);


  for (var x = 0, block; block = blocks[x]; x++) {
    if (block.type !== 'procedures_defnoreturn'){
      console.log('skipping block of type', block.type, ':', block);
      continue;
    }
    var line = this.blockToCode(block);
    if (goog.isArray(line)) {
      // Value blocks return tuples of code and operator order.
      // Top-level blocks don't care about operator order.
      line = line[0];
    }
    if (line) {
      if (block.outputConnection && this.scrubNakedValue) {
        // This block is a naked value.  Ask the language's code generator if
        // it wants to append a semicolon, or something.
        line = this.scrubNakedValue(line);
      }
      code.push(line);
    }
  }
  code = code.join('\n');  // Blank line between each section.
  code = this.finish(code);
  // Final scrubbing of whitespace.
  code = code.replace(/^\s+\n/, '');
  code = code.replace(/\n\s+$/, '\n');
  code = code.replace(/[ \t]+\n/g, '\n');
  return code;
};
