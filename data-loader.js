var fs = require('fs');
var path = require('path');

//turns on typescript requires
require('ts-node/register')
var dataload = require('./src/dataload');
//turns typescript requires back off
delete require.extensions['.ts'];
delete require.extensions['.tsx'];

/** Given a data-style data structure, return a list of sprites with info */
module.exports = function(source) {
    // ignores the source, just use the directory
    this.cacheable();

    var dir = this.resourcePath.slice(0, -8);
    var filePaths = fs.readdirSync(dir).filter(function(x){
      return x.slice(-4) === '.txt';
    }).map(function(x){
      return path.resolve(dir + x);
    });

    var self = this;
    filePaths.map(function(x){
      self.addDependency(x);
    });

    // for predictable load order
    filePaths.sort();

    var text = filePaths.map(function(x){
      return fs.readFileSync(x, {encoding: 'utf8'});
    }).join('\n');

    return dataload.loadData(text);
};

