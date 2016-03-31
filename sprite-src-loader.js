/** Given a data-style data structure, return a list of sprites with info */
var fs = require('fs');

/** source should be a list of sprites */
module.exports = function(source) {
  this.cacheable();
  var spriteFiles = source;

  function id(sprite){
    return sprite.replace(/ /g, '_');
  }

  var output = '';

  for (var sprite of Object.keys(spriteFiles)){
    output += '<img src="'+spriteFiles[sprite]+'" ' +
              'id="'+id(sprite)+'" '+
              'alt="sprite for '+sprite+'" >\n';
  }
  return output;
};

