var fs = require('fs');
var path = require('path');

parent = require('./webpack.config');

var externals = {};
// Add node modules, but hey they're commonjs
fs.readdirSync('node_modules').filter(function(x) {
  return ['.bin'].indexOf(x) === -1;
}).forEach(function(mod) {
  externals[mod] = 'commonjs ' + mod;
});
// add previous externals, we'll put these in globals manually
Object.keys(parent.externals).forEach( name => {
  externals[name] = parent.externals[name];
});
// this lets us manually load these globals
var name = './hotswapping-js-interp/interpreter'
externals[name] = 'commonjs '+name;

parent.entry = ['babel-polyfill', './loadnodetests.js'],
parent.target = 'node';
parent.output = { filename: 'nodetest.build.js', };
parent.externals = externals;
//parent.externals = [].concat(nodeModules, parent.externals);

module.exports = parent;
