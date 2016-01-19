// Simple REPL for shiplang
var readline = require('readline');
var evaluation = require('./bundle');
var process = require('process');

if (process.argv[2] === 'interp'){
  var interp = new evaluation.InterpreterSession();
} else if (process.argv[2] === 'trace'){
  var interp = new evaluation.TraceSession();
} else {
  var interp = new evaluation.CompilerSession();
}

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.setPrompt('=> ');
rl.on('line', function (cmd) {
  console.log(interp.run(cmd));
  rl.prompt();
});
rl.prompt();
