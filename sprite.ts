/** Returns the DOM id for a sprite */

var dimensions = require('json!./sprite-size-loader!./sprite-loader!./data-loader!./data');

export function spriteId(name: string): string{
    return name.replace(/ /g, '_');
}

export function getLandscapeFilename(name: string): string{
    var filename = '/esimages/' + name + '.jpg';
    return filename;
}

export function spriteWidth(name: string): number{

    var dims = dimensions[name];
    if (dims === undefined){
        console.log('could not find sprite for', name);
        return 2000;
    } else {
        return dims[0];
    }
}
