/** Given a data-style data structure, return a list of sprites with info */
var fs = require('fs');

/** source should be a list of sprites */
module.exports = function(source) {
  this.cacheable();
  var sprites = source;

  var images = sprites.map(function(x){
    filename = '/esimages/' + x + '.png';
    if (!fs.existsSync('.'+filename)){
      throw Error("referenced image does not exist: "+filename);
    }
    return filename;
  });

  var ids = sprites.map(function(sprite){
    return sprite.replace(/ /g, '_');
  });

  var output = '';

  for (var i = 0; i<sprites.length; i++){
    output += '<img src="'+images[i]+'" ' +
              'id="'+ids[i]+'" '+
              'alt="sprite for '+sprites[i]+'" >\n';
  }
  return output;
};

