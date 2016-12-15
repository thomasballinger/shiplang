/** Given a data-style data structure, return a list of sprites with info */
var fs = require('fs');
var imageprocess = require('./nodesrc/imageprocess');

/** source should be a list of sprites */
module.exports = function(source) {
  var callback = this.async();
  this.cacheable();
  var spriteFiles = source;

  var outlines = {};

  // skip animations with multiple frames
  var spritesThatNeedOutlines = Object.keys(spriteFiles).filter(function(sprite){
    return !Array.isArray(spriteFiles[sprite]);
  });

  for (var sprite of spritesThatNeedOutlines){
    var filename = spriteFiles[sprite];

    var thisCB = function(spriteName, filename){
      return function(path){
        outlines[spriteName] = path;
        if (Object.keys(outlines).length === spritesThatNeedOutlines.length){
          callback(null, outlines);
        } else {
          console.log(Object.keys(outlines).length+'/'+spritesThatNeedOutlines.length+' outlines complete');
        }
      };
    }(sprite, spriteFiles[sprite]);

    imageprocess.findOutline(filename, thisCB);
  }
};
