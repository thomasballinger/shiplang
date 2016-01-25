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
