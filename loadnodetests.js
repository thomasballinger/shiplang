
// Expected to be globally available
global.DEBUGMODE = false;

// Loading this without window defined creates Interpreter,
// acorn, and deepCopy on the global object
require('./hotswapping-js-interp/interpreter.js');

if (typeof acorn === 'undefined'){ throw Error('acorn should be defined'); }
if (typeof deepCopy === 'undefined'){ throw Error('deepCopy should be defined'); }

/* TODO a possible solution:
// make window available
global.window = window
*/

var browsertests = require('./tests/index');
var nodetests = require('./nodetests/index');
