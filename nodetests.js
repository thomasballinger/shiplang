
// Expected to be globally available
global.DEBUGMODE = false;

// Loading this without window defined also creates
// acorn and deepCopy on the global object
global.Interpreter = require('./hotswapping-js-interp/interpreter.js');

/* TODO a possible solution:
// make window available
global.window = window
*/

var tests = require('./tests/index');
console.log(tests);
