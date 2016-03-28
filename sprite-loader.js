/** Given a data-style data structure, return a list of sprites with info */
var fs = require('fs');

module.exports = function(source) {
  var data = source;
  this.cacheable();
  var sprites = {};
  for (var domain of Object.keys(data)){
    for (var id of Object.keys(data[domain])){
      if (data[domain][id].sprite !== undefined){
        for (var sprite of data[domain][id].sprite){
          sprites[sprite] = true;
        }
      }
    }
  }
  sprites = Object.keys(sprites);

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

