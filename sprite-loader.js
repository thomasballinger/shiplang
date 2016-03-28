/* Goal: to load all data at compile time. Sprite loader will extract what
 * sprites are needed, but rest of data will also be turned into json.
 *
 * data-loader(directory)
 *
 *
 *                                     ---loaded--+
 *                                ----other---+   |  +---data----
 *                                            V   V  V
 * txt files ---raw-loader----data-loader----data-merge-loader----> JSON
 *
 * that json is used by the sprite-loader and used plain with a json loader
 *
 * require(
 */

var fs = require('fs');

//turns on typescript requires
require('typescript-require');
var dataload = require('./dataload');
//turns typescript requires back off
delete require.extensions['.ts'];

/** Given a data-style data structure, return a list of sprites with info */
module.exports = function(source) {
    this.cacheable();
    var data = dataload.loadData(source);
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
                'alt="sprite" >\n';
    }
    console.log(output);

    return output;
};

