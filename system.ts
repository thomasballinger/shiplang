import { Gov, ShipSpec } from './interfaces';
import { Domains } from './dataload';


// Building blocks of the world like this should be read-only for now
// Changes to them would be written to the player's profile so support
// for multiple data files
// 
 
/** A solar system, the setting for a game engine */

interface AllObjects{
    systems: {[name: string]: System};
    spobs: {[name: string]: Spob};
    fleets: {[name: string]: Fleet};
    variants: {[name: string]: Variant};
    phrases: {[name: string]: Phrase};
    planets: {[name: string]: Planet};
    starts: {[name: string]: Start};

    [domain: string]: {[name: string]: any};
}

export function createObjects(domains: Domains): AllObjects{
    var dataKeys: {[name: string]: DataStatic} = {
        'system': System,
        'fleet': Fleet,
        'variant': Variant,
        'object': Spob,  // datafiles use "object"
        'phrase': Phrase,
        'planet': Planet,
        'start': Start,
    }
    var allObjects: AllObjects = {
        systems: {},
        spobs: {},
        fleets: {},
        variants: {},
        phrases: {},
        planets: {},
        starts: {},
        names: {},
    };
    // create the objects
    for (var dataKey of Object.keys(dataKeys)){
        var dataClass = dataKeys[dataKey]
        for (var name of Object.keys(domains[dataKey] || {})){
            //TODO map dataKeys to AllObject properties in a better
            // way than just adding an s to the end
            allObjects[dataClass.fieldName][name] = new dataClass(name);
        }
    }

    // populate the objects
    for (var dataKey of Object.keys(dataKeys)){
        var fieldName = dataKeys[dataKey].fieldName;
        for (var id of Object.keys(allObjects[fieldName])){
            var object: DataNode = allObjects[fieldName][id];
            var data: any = domains[dataKey][id];
            object.populate(data, allObjects);
        }
    }
    return allObjects;
}
//TODO deal with anonymous objects by allowing them in populate methods

export abstract class DataNode{
    constructor(id?: string){
        this.id = id || "anonymous "+this.constructor.toString();
    }
    abstract populate(data: any, global: AllObjects): void;
    id: string;
    public static fieldName: string;
}

interface DataStatic {
    new(id?: string): DataNode;
    fieldName: string;
}

var dataKeys: {[name: string]: DataStatic} = {
    'system': System,
    'fleet': Fleet,
    'variant': Variant,
    'spob': Spob,
    'phrase': Phrase,
    'planet': Planet,
    'start': Start,
}



function checkExists(name: string, domain: string, global: AllObjects){
    if (global[domain] === undefined){ throw Error('bad domain: '+domain); }
    if (!global[domain].hasOwnProperty(name)){
        throw Error("Can't find "+name+" in "+domain+":"+Object.keys(global[domain]));
    }
}

export class System extends DataNode{
    // Can be instantiated without any data because component data might
    // not have been instantiated yet.
    populate(data: any, global: AllObjects){
        if (data.pos === undefined){ throw Error('No position listed for system '+this.id); }
        if (data.pos.length > 1){ throw Error('Too many positions listed for system'); }
        this.position = data.pos[0].map(function(x: string){ return parseInt(x); });
        if (this.position.length !== 2){ throw Error('expected two numebers for position: '+data.pos); }
        if (data.government === undefined){ throw Error('No government value for system '+this.id); }
        this.government = data.government[0];
        if (Gov[this.government] === undefined){ throw Error('Bad government value: '+this.government); }
        this.links = (data.link || []).map(function(x: string){
            checkExists(x, 'systems', global);
            return global.systems[x];
        });
        this.fleets = (data.fleet || []).map(function(x: string){
            checkExists(x, 'fleets', global);
            return global.fleets[x];
        });
        this.spobs = (data.object || []).map(function(x: string){
            checkExists(x, 'spobs', global);
            return global.spobs[x];
        })
    }
    position: [number, number];
    government: Gov
    links: System[];
    fleets: [Fleet, number][];
    spobs: Spob[];
}
System.fieldName = 'systems';

export class Fleet extends DataNode{
    populate(data: any, global: AllObjects){
        if (data.government === undefined){ throw Error('No government value for fleet '+this.id); }
        this.government = data.government[0];
        if (Gov[this.government] === undefined){ throw Error('Bad government value: '+this.government); }
        //checkExists(data.name, 'phrases', global);
        this.name = new Phrase(); //TODO ignoring data for now
        this.personality = data.personality ? data.personality[0] : []; //TODO no validation yet
        this.variants = data.variant.map(function(x: any){
            // variants aren't stored globally
            var v = new Variant();
            v.populate(x, global);
            if (x.weight < 0){ throw Error('Negative value found for variant'); }
            return [v, x.weight];
        })
        if (this.variants.length === 0){ throw Error("No variants found for fleet "+this.id); }
    }
    government: Gov;
    name: Phrase;
    personality: string[];
    variants: [Variant, number];
}
Fleet.fieldName = 'fleets';

export class Variant extends DataNode{
    populate(data: any, global: AllObjects){

    }
    ships: [ShipSpec[], number];
}
Variant.fieldName = 'variants';

/** Object, called Spob for Space Object to avoid JS builtin */
export class Spob extends DataNode{
    populate(data: any, global: AllObjects){
        if (data.distance === undefined){ throw Error('No distance found for planet '+this.id); }
        if (data.distance.length > 1){ throw Error('Too many distances listed for spob'); }
        this.distance = parseFloat(data.distance[0]);
        if (data.period === undefined){ throw Error('No period found for planet '+this.id); }
        if (data.period.length > 1){ throw Error('Too many periods listed for spob'); }
        this.period = parseFloat(data.period[0]);
        if (data.radius === undefined){
            console.log('no radius found for planet '+this.id+' so using default'); 
            this.radius = 40;
        } else {
            if (data.radius.length > 1){ throw Error('Too many radii listed for spob'); }
            this.radius = parseFloat(data.radius[0]);
        }
        if (data.color === undefined){
            console.log('no color found for planet '+this.id+' so using default');
            this.color = '#123456';
        } else {
            if (data.color.length > 1){ throw Error('Too many colors listed for spob'); }
            this.color = data.color[0];
            if (!/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(this.color)){ throw Error("Color doesn't look like a hex color: "+this.color); }
        }
    }
    distance: number;
    period: number;
    radius: number;
    color: string;
}
Spob.fieldName = 'spobs';

/** Will implement random names */
export class Phrase extends DataNode{
    populate(data: any, global: AllObjects){}
    choose(){
        return 'Redbeard';
    }
}
Phrase.fieldName = 'phrases';

/** Planets should have a corresponding object to make them accessible */
export class Planet extends DataNode{
    populate(data: any, global: AllObjects){}
}
Planet.fieldName = 'planets';

export class Start extends DataNode{
    populate(data: any, global: AllObjects){
        checkExists(data.system[0], 'systems', global);
        this.system = global.systems[data.system[0]];
        checkExists(data.planet[0], 'spobs', global);
        this.planet = global.planets[data.planet[0]];
    }
    day: number;
    system: System;
    planet: Planet;
    credits: number;
    missions: [string, any][];
}
Start.fieldName = 'starts'
