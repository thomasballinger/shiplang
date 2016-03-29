/** Given a data-style data structure, return a list of sprites with info */
var fs = require('fs');
var imageprocess = require('./imageprocess');

/** source should be a list of sprites */
module.exports = function(source) {
  var callback = this.async();
  this.cacheable();
  var sprites = source;

  var images = sprites.map(function(x){
    filename = './esimages/' + x + '.png';
    if (!fs.existsSync(filename)){
      throw Error("referenced image does not exist: "+filename);
    }
    return filename;
  });

  var outlines = {};
  for (var i=0; i < images.length; i++){
    var sprite = sprites[i];
    var filename = images[i];

    var thisCB = function(spriteName){
      return function(path){
        outlines[spriteName] = path;
        if (Object.keys(outlines).length === sprites.length){
          callback(null, outlines);
        } else {
          console.log(Object.keys(outlines).length+'/'+sprites.length+' outlines complete');
        }
      };
    }(sprite);

    imageprocess.findOutline(filename, thisCB);
  }
};
