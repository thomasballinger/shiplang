// Simple REPL for shiplang
var readline = require('readline');
var evaluation = require('./eval');
var process = require('process');

if (process.argv[1] === 'interp'){
  var interp = new evaluation.InterpreterSession();
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
