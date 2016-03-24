var fs = require('fs');
var path = require('path');

parent = require('./webpack.config');

var nodeModules = {};
fs.readdirSync('node_modules').filter(function(x) {
  return ['.bin'].indexOf(x) === -1;
}).forEach(function(mod) {
  nodeModules[mod] = 'commonjs ' + mod;
});

console.log('adding to externals:');
console.log(nodeModules);

parent.entry = './nodetests.js';
parent.target = 'node';
parent.output = { filename: 'nodetest.build.js', };
parent.externals = [].concat(nodeModules, parent.externals);

module.exports = parent;