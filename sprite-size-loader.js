/** Given a data-style data structure, return a list of sprites with info */
var fs = require('fs');

/** source should be a list of sprites */
module.exports = function(source) {
  this.cacheable();
  var spriteFiles = source;

  var dimensions = {};
  for (var sprite of Object.keys(spriteFiles)){
    var filename = spriteFiles[sprite];
    // skip multiple frame animations
    if (Array.isArray(filename)){
      continue;
    }
    dimensions[sprite] = getDimsPNG(filename);
  }

  return dimensions;
};

/** Return dimensions of a png file */
function getDimsPNG(filename){
  if (filename.slice(-4).toLowerCase() !== '.png'){
    throw Error("sprites doesn't have a png extension: " + filename);
  }
  var buffer = new Buffer(24);
  var png = fs.openSync(filename, 'r');
  fs.readSync(png, buffer, 0, 24);

  // png header
  var pngHeader = new Buffer([ 137, 80, 78, 71, 13, 10, 26, 10 ]);
  // Buffer.compare returns 0 if the buffers are identical
  if (buffer.slice(0, 8).compare(pngHeader)){
    throw Error('Non-png header found for sprite');
  }

  width = buffer.readUInt32BE(16);
  height = buffer.readUInt32BE(20);
  return [width, height];
}
