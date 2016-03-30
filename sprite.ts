/** Returns the DOM id for a sprite */

var dimensions = require('json!./sprite-size-loader!./sprite-loader!./data-loader!./data');
var outlines = require('json!./sprite-outline-loader!./sprite-loader!./data-loader!./data');

export function spriteId(name: string): string{
    return name.replace(/ /g, '_');
}

export function getLandscapeFilename(name: string): string{
    var filename = '/esimages/' + name + '.jpg';
    return filename;
}

export function spriteSize(name: string): [number, number]{
    return dimensions[name];
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

export function getSpritePath(name: string): [number, number][]{
    var path = outlines[name];
    if (path === undefined){
        console.log('could not find sprite for', name);
        return [[0, -50], [50, 0], [0, 50], [-50, 0]];
    } else {
        return path;
    }
}
