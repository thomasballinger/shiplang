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
  return sprites;
};

