/** Returns the DOM id for a sprite */

var files = require('json-loader!../sprite-loader!../data-loader!../data');
var dimensions = require('json-loader!../sprite-size-loader!../sprite-loader!../data-loader!../data');
var vertices = require('json-loader!../sprite-outline-loader!../sprite-loader!../data-loader!../data');
var lines = connectSpriteVertices(vertices);

function connectSpriteVertices(vertices: { [sprite: string]: [number, number][] }){
    var lines: { [name: string]: [[number, number], [number, number]][] } = {};
    for (var sprite of Object.keys(vertices)){
        var points = vertices[sprite];
        var l: [[number, number], [number, number]][] = [];
        var lastPoint = points[points.length-1];
        for (var point of points){
            l.push([lastPoint, point])
            lastPoint = point;
        }
        lines[sprite] = l;
    }
    return lines;
}

export function spriteId(name: string, i?: number): string{
    if (i === undefined){
        return name.replace(/ /g, '_');
    } else {
        return name.replace(/ /g, '_')+'_'+i;
    }
}

export function getLandscapeFilename(name: string): string{
    var filename = '/esimages/' + name + '.jpg';
    return filename;
}

export function spriteSize(name: string): [number, number]{
    return dimensions[name];
}

export function spriteFrames(name: string): number{
    if (Array.isArray(files[name])){
        return files[name].length;
    } else {
        return undefined;
    }
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

export function spritePath(name: string): [number, number][]{
    var path = vertices[name];
    if (path === undefined){
        console.log('could not find sprite for', name);
        return [[0, -50], [50, 0], [0, 50], [-50, 0]];
    } else {
        return path;
    }
}

export function spriteLines(name: string): [[number, number], [number, number]][]{
    var l = lines[name];
    if (lines === undefined){
        throw Error('no lines found for '+name);
    }
    return l;
}
