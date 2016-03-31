/** Given a data-style data structure, return a list of sprites with info */
var fs = require('fs');

/** source should be a list of sprites */
module.exports = function(source) {
  this.cacheable();
  var spriteFiles = source;

  function id(sprite, i){
    if (i === undefined){
      return sprite.replace(/ /g, '_');
    } else {
      return sprite.replace(/ /g, '_')+'_'+i;
    }
  }

  var output = '';

  for (var sprite of Object.keys(spriteFiles)){
    if (Array.isArray(spriteFiles[sprite])){
      for (var i=0; i<spriteFiles[sprite].length; i++){
        output += '<img src="'+spriteFiles[sprite][i]+'" ' +
                  'id="'+id(sprite, i)+'" '+
                  'alt="sprite for '+sprite+'_'+i+'" >\n';
      }
    } else {
      output += '<img src="'+spriteFiles[sprite]+'" ' +
                'id="'+id(sprite)+'" '+
                'alt="sprite for '+sprite+'" >\n';
    }
  }
  return output;
};

