/** Given a data-style data structure, return a list of sprites with info */
var fs = require('fs');

// A recursive search on loaded data is safe:
// it's a tree, it hasn't been wired up into a network yet.
function findSprites(obj){

  if (obj === undefined){ return []; }
  if (typeof obj === 'string'){ return []; }

  var sprites = [];
  if (Array.isArray(obj)){
    for (var innerObj of obj){
      sprites.push.apply(sprites, findSprites(innerObj));
    }
    return sprites;
  }
  if (obj.sprite !== undefined){
    if (Array.isArray(obj.sprite)){
      sprites = [].concat(sprites, obj.sprite);
    } else if (typeof obj.sprite === 'string'){
      sprites.push(obj.sprite);
    } else {
      throw Error('obj.sprite had unexpected value: '+obj.sprite);
    }
  }
  for (var key of Object.keys(obj)){
    sprites.push.apply(sprites, findSprites(obj[key]));
  }
  return sprites;
}

// Not mentioned in data but needed
var engineSprites = [
  'effect/explosion/big~1'
];

module.exports = function(source) {
  var data = source;
  this.cacheable();

  var sprites = findSprites(data);
  sprites.push.apply(sprites, engineSprites);

  spriteFiles = {};
  var path = './esimages/';
  var images = sprites.map(function(x){
    filename = path + x + '.png';
    if (fs.existsSync(filename)){
      spriteFiles[x] = filename;
    } else if (fs.existsSync(path+x+'~0.png')){
      var frames = [];
      var i = 0;
      while (fs.existsSync(path+x+'~'+i+'.png')){
        frames.push(path+x+'~'+i+'.png');
        i++;
      }
      spriteFiles[x] = frames;
    } else {
      throw Error("referenced image does not exist: "+filename);
    }
    return filename;
  });

  console.log(spriteFiles);
  return spriteFiles;
};

