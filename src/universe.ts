import { Gov } from './interfaces';
import { Domains } from './dataload';
import { Profile } from './profile';
import { chooseScript, getScriptByName, getJSByName } from './ai';
import { Event, EventType, killFiveAstroidsProcess } from './mission';
import { Engine, makeShipEntity } from './engine';
import { loadData } from './dataload';
import { spriteWidth } from './sprite';

/** Building blocks of the universe. Read-only, and certainly
 *  won't change while an engine is running.
 *  Eventually changes to them will be written to the player's profile,
 *  and loaded by loading normal data then loading the player's changes.
 *  Once this happens, planet offsets (the only currently nondeterministic data)
 *  will need to be stored on the player's Profile object because this patching
 *  will take place at the data level, not the objects level so the universe
 *  will need to be rebuilt each these changes are applied.
 */

interface AllObjects{
    systems: {[name: string]: System};
    spobs: {[name: string]: Spob};
    fleets: {[name: string]: Fleet};
    variants: {[name: string]: Variant};
    phrases: {[name: string]: Phrase};
    planets: {[name: string]: Planet};
    starts: {[name: string]: Start};
    ships: {[name: string]: Ship};
    missions: {[name: string]: Mission};
    effects: {[name: string]: Effect}

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
        'ship': Ship,
        'mission': Mission,
        'effect': Effect,
    }
    var allObjects: AllObjects = {
        systems: {},
        spobs: {},
        fleets: {},
        variants: {},
        phrases: {},
        planets: {},
        starts: {},
        ships: {},
        missions: {},
        effects: {},
    };
    // create the objects
    console.log('dataKeys', dataKeys);
    console.log('System', dataKeys['system']);
    console.log('Planet', dataKeys['planet']);
    console.log('Object.keys(dataKeys)', Object.keys(dataKeys));
    for (var dataKey of Object.keys(dataKeys)){
        var dataClass = dataKeys[dataKey]
        console.log('dataKey', dataKey);
        console.log('data class', dataClass);
        for (var name of Object.keys(domains[dataKey] || {})){
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
// * spobs allow them
// * anyone else?

export abstract class DataNode{
    constructor(id?: string){
        this.id = id || "anonymous "+this.constructor.name;
    }
    abstract populate(data: any, global: AllObjects): void;
    id: string;
    public static fieldName: string;
}

interface DataStatic {
    new(id?: string): DataNode;
    fieldName: string;
}

function checkExists(name: string, domain: string, global: AllObjects){
    if (global[domain] === undefined){ throw Error('bad domain: '+domain); }
    if (!global[domain].hasOwnProperty(name)){
        throw Error("Can't find "+name+" in "+domain+":"+Object.keys(global[domain]));
    }
}

/** A solar system, the setting for a game engine */
export class System extends DataNode{
    // Can be instantiated without any data because component data might
    // not have been instantiated yet.
    populate(data: any, global: AllObjects){
        if (data.pos === undefined){ throw Error('No position listed for system '+this.id); }
        if (data.pos.length > 1){ throw Error('Too many positions listed for system'); }
        if (data.pos[0].length !== 2){ throw Error('expected two numebers for position: '+data.pos); }
        [this.x, this.y] = data.pos[0].map(function(x: string){ return parseInt(x); });
        if (data.government === undefined){ throw Error('No government value for system '+this.id); }
        this.government = data.government[0];
        if (Gov[this.government] === undefined){ throw Error('Bad government value: '+this.government); }
        var id = this.id;
        this.links = (data.link || []).map(function(x: string){
            checkExists(x, 'systems', global);
            if (global.systems[x].hasOwnProperty('links') && global.systems[x].links.filter(function(other){
                return other.id === id;
            }).length < 1){ //TODO check the other situation, that a system that does have its
                            // links has this system in it but this system doesn't link to that one
                console.log('Warning: one-way link detected from '+this.id+' to '+x);
            }
            return global.systems[x];
        });
        this.fleets = (data.fleet || []).map(function(x: string){
            if (x.length != 2){ throw Error("fleet entry of wrong structure: "+x); }
            checkExists(x[0], 'fleets', global);

            //converts periods in 60fps frams to seconds
            var inSeconds = parseInt(x[1]) / 60
            return [global.fleets[x[0]], inSeconds];
        });
        this.spobs = (data.object || []).map(function(x: any){
            if (typeof x === 'string'){
                checkExists(x, 'spobs', global);
                return global.spobs[x];
            } else {
                var s = new Spob()
                s.populate(x, global);
                return s
            }
        })
        for (var [kind, ...rest] of data.hazard || []){
            if (kind === 'delay'){
                this.delay = parseFloat(rest[0]);
            }
        }
        Object.freeze(this);
    }
    x: number;
    y: number;
    government: Gov
    links: System[];
    fleets: [Fleet, number][];
    spobs: Spob[];
    delay: number;

    getFleets(dt: number):Fleet[]{
        if (this.fleets.length === 0){ return []; }

        var fleets: Fleet[] = [];
        for (var [fleet, period] of this.fleets){
            var r = Math.random()
            if (r*period < dt){
                fleets.push(fleet);
            }
        }
        return fleets;
    }
    spobSpots(day: number):[Spob, [number, number]][]{
        var spots: [Spob, [number, number]][] = [];
        for (var spob of this.spobs){
            spots = [].concat(spots, spob.treeSpots([0, 0], day))
        }
        return spots;
    }
    createInitialFleets(world: Engine, profile: Profile){
        // System Fleets
        for (var fleet of this.getFleets(50)){
            world.addFleet(fleet);
        }
        // Mission fleets
        for (var fleet of profile.getMissionFleets()){
            world.addFleet(fleet);
        }
    }
    createFleets(world: Engine, dt: number){
        for (var fleet of this.getFleets(dt)){
            console.log('adding a fleet');
            world.addFleet(fleet);
        }
    }
    createPlayerShipEntity(world: Engine, profile: Profile, script: any){
        var x = profile.spaceLocation ? profile.spaceLocation[0] : 0;
        var y = profile.spaceLocation ? profile.spaceLocation[1] : 0;
        var ship = makeShipEntity(profile.ship, x, y, 270, script);
        ship.imtheplayer = true;
        ship.government = Gov.Player
        world.ships.push(ship);
    }
}
System.fieldName = 'systems';
console.log('System: ', System);

export class Fleet extends DataNode{
    populate(data: any, global: AllObjects){
        if (data.government === undefined){ throw Error('No government value for fleet '+this.id); }
        this.government = <Gov><any>Gov[data.government[0]];
        if (Gov[this.government] === undefined){ throw Error('Bad government value: '+this.government); }
        //checkExists(data.name, 'phrases', global);
        this.name = new Phrase(); //TODO ignoring data for now
        this.personality = data.personality ? data.personality : []; //TODO no validation yet
        this.variants = data.variant.map(function(x: any){
            // variants aren't stored globally
            var v = new Variant();
            v.populate(x, global);
            if (x.weight < 0){ throw Error('Negative value found for variant'); }
            return [v, x.weight];
        })
        if (this.variants.length === 0){ throw Error("No variants found for fleet "+this.id); }
        Object.freeze(this);
    }
    government: Gov;
    name: Phrase;
    personality: string[];
    variants: [Variant, number][];

    //TODO use deterministic randomness here
    /** A randomly-chosen list of Ships */
    getShips(): Ship[]{
        var variant = chooseFromWeightedOptions(this.variants);
        var ships = variant.getShips();
        return ships;
    }
}
Fleet.fieldName = 'fleets';

function chooseFromWeightedOptions<A>(options: [A, number][], r?: number): A{
    if (r === undefined){ r = Math.random(); }

    var total = options.reduce(function(acc: number, option: [A, number]){
        return acc + option[1];
    }, 0);
    r *= total;
    var cum = 0;
    for(var [option, n] of options){
        cum += n
        if (r < cum){
            return option;
        }
    }
    throw Error("logic error, shouldn't reach this");
}

export class Variant extends DataNode{
    populate(data: any, global: AllObjects){
        this.ships = [];
        for (var key of Object.keys(data)){
            if (key === 'domain'){ continue; }
            if (key === 'weight'){ continue; }
            // no ids for variants
            checkExists(key, 'ships', global);
            var ship = global.ships[key]
            if (data[key].length > 1){
                throw Error('ship listed twice: '+key);
            }
            var num = (data[key][0] === undefined || data[key][0] === null) ? 1: parseInt(data[key][0]);
            if (!isFinite(num)){
                throw Error('Bad number for variant: '+key+': '+data[key]);
            }
            this.ships.push([ship, num]);
        }
        if (this.ships.length === 0){
            throw Error("No ships entries found for variant");
        }
        Object.freeze(this);
    }
    getShips(): Ship[]{
        var ships: Ship[] = [];
        this.ships.map(function(x: [Ship, number]){
            for (var i=0; i<x[1]; i++){
                ships.push(x[0]);
            }
        });
        return ships;
    }
    ships: [Ship, number][];
}
Variant.fieldName = 'variants';

/** Object, called Spob for Space Object to avoid JS builtin */
export class Spob extends DataNode{
    populate(data: any, global: AllObjects){
        if (data.sprite === undefined){
            throw Error('no sprite found for planet '+this.id);
        } else {
            if (data.sprite.length > 1){ throw Error('Too many sprites listed for spob'); }
            this.sprite = data.sprite[0];
        }
        if (data.distance === undefined){
            if (this.sprite.slice(0, 4) === 'star'){
                this.distance = 0;
            } else {
                throw Error('No distance found for planet '+this.id);
            }
        } else {
            if (data.distance.length > 1){
                throw Error('Too many distances listed for spob');
            } else {
                this.distance = parseFloat(data.distance[0]);
            }
        }
        if (data.period === undefined){
            if (this.distance === 0){
                this.period = 1;
            } else {
                throw Error('No period found for planet '+this.id); }
        } else {
            if (data.period.length > 1){
                throw Error('Too many periods listed for spob');
            } else {
                this.period = parseFloat(data.period[0]);
            }
        }
        this.r = spriteWidth(this.sprite) / 2;
        this.spobs = (data.object || []).map(function(x: any){
            if (typeof x === 'string'){
                checkExists(x, 'spobs', global);
                return global.spobs[x];
            } else {
                var s = new Spob()
                s.populate(x, global);
                return s
            }
        })
        // each time loaded planets will be in different positions.
        this.offset = Math.random();

        //TODO can't freeze because Planets modify Spobs
        //Object.freeze(this);
    }
    distance: number;
    r: number;
    period: number;
    sprite: string;
    offset: number;
    spobs: Spob[];
    planet: Planet;
    position(center: [number, number], day: number): [number, number]{
        var angle = (this.offset * this.period + day) * 2 * Math.PI / this.period;
        return [center[0] + Math.cos(angle) * this.distance, center[1] + Math.sin(angle) * this.distance];
    }
    treeSpots(center: [number, number], day: number): [Spob, [number, number]][]{
        var [x, y] = this.position(center, day);
        return [].concat.apply([[this, [x, y]]],
                                this.spobs.map(function(s){
                                    return s.treeSpots([x, y], day);
                                }));
    }
}
Spob.fieldName = 'spobs';

/** Will implement random names */
export class Phrase extends DataNode{
    populate(data: any, global: AllObjects){
        Object.freeze(this);
    }
    choose(){
        return 'Redbeard';
    }
}
Phrase.fieldName = 'phrases';

export class Start extends DataNode{
    populate(data: any, global: AllObjects){
        checkExists(data.system[0], 'systems', global);
        this.system = global.systems[data.system[0]];
        checkExists(data.planet[0], 'spobs', global);
        this.spob = global.spobs[data.planet[0]];
        this.script = data.script ? data.script[0] : 'console.log("no script specified");';
        if (data.ship === undefined){ throw Error("No ship provided for start "+this.id)}
        checkExists(data.ship[0], 'ships', global);
        this.ship = global.ships[data.ship]
        if (this.ship === undefined){
            throw Error("Can't find ship "+data.ship);
        }
        this.missions = (data.mission || []).map(function(name: string){
            checkExists(name, 'missions', global);
            return global.missions[name];
        })
        Object.freeze(this);
    }
    day: number;
    system: System;
    spob: Spob;
    credits: number;
    missions: Mission[];
    script: string;
    ship: Ship;
    buildProfile(): Profile{
        var p = Profile.newProfile()
        .set('location', this.system)
        .set('script', getJSByName(this.script))
        .set('ship', this.ship)
        .initiateMissions(this.missions);
        return p
    }
}
Start.fieldName = 'starts'

export class Ship extends DataNode{
    populate(data: any, global: AllObjects){
        this.drawStatus = {};
        this.drawStatus['sprite'] = data.sprite[0];
        if (data.sprite.length === 2){
            this.drawStatus['thrustSprite'] = data.sprite[1];
        }

        this.shieldsMax = parseInt(data.attributes[0].shields[0]);
        this.armorMax = parseInt(data.attributes[0].hull[0]);
        this.maxThrust = parseInt(data.attributes[0].maxThrust[0]);
        this.maxSpeed = parseInt(data.attributes[0].maxSpeed[0]);
        this.maxDH = parseInt(data.attributes[0].maxDH[0]);

        this.drawStatus['notDirectional'] = data.attributes[0].hasOwnProperty('notDirectional') ? true : false
        this.drawStatus['engines'] = (data.engine || []).map(function(spot: [string, string]){
            return [parseInt(spot[0]), parseInt(spot[1])];
        });

        // optional
        this.isMunition = data.attributes[0].hasOwnProperty('isMunition') ? true : false
        this.isComponent = data.attributes[0].hasOwnProperty('isComponent') ? true : false
        this.isInertialess = data.attributes[0].hasOwnProperty('isIntertialess') ? true : false
        this.lifespan = data.attributes[0].lifespan ? parseFloat(data.attributes[0].lifespan[0]) : undefined
        this.explode = data.explode ? global.effects[data.explode[0]] : global.effects['tiny explosion'];
        if (this.explode === undefined){ throw Error('Bad explosion value: '+data.explode); }

        this.r = 20; //TODO use sprite infomation TODO eventually don't use radius-based collisions
        this.type = this.id.toLowerCase(); //TODO get rid of this?
        Object.freeze(this);
    }
    drawStatus: {[name: string]: any};
    shieldsMax: number;
    armorMax: number;
    maxThrust: number;
    maxDH: number;
    maxSpeed: number;
    explode: Effect;

    r: number;
    isMunition: boolean;
    isInertialess: boolean;
    lifespan: number;
    type: string;
    explosionSize: number;
    isComponent: boolean;

}
Ship.fieldName = 'ships'

export class Mission extends DataNode{
    populate(data: any, global: AllObjects){
        if (data.processEventMethod[0] !== 'killFiveAstroidsProcess'){ throw Error("Process event method "+data.missionClass[0]+" not found for mission "+this.id); }
        this.processEventMethod = killFiveAstroidsProcess;
        this.fleets = (data.fleet || []).map(function(x: string){
            if (typeof x !== 'string'){ throw Error("fleet entry of wrong structure: "+x); }
            checkExists(x, 'fleets', global);
            return global.fleets[x];
        });
        this.description = data.description ? data.description[0] : 'a mission with unclear objectives';
    }
    fleets: Fleet[]
    processEventMethod: (e: Event, data: any)=>void;
    description: string
    begin(): [Mission, any]{
        return [this, {}]
    }
    save(data: any): [string, any]{
        return [this.id, data];
    }
    getFleets(): Fleet[]{
        return this.fleets;
    }
}
Mission.fieldName = 'missions';

export class Planet extends DataNode{
    populate(data: any, global: AllObjects){
        global.spobs[this.id].planet = this;
        this.description = data.description ? data.description.join('\n') : '';
        this.bar = data.bar ? data.bar.join('\n') : '';
        this.landscape = data.landscape[0];
        Object.freeze(this);
    }
    description: string;
    landscape: string;
    bar: string;
}
Planet.fieldName = 'planets';
console.log("Planet: ", Planet);

export class Effect extends DataNode{
    populate(data: any, global: AllObjects){
        this.sprite = data.sprite[0];
        this.frameRate = parseFloat(data['frame rate'][0]);
        if (!Number.isFinite(this.frameRate)){
            throw Error('Frame rate for '+this.id+' is not a number: '+this.frameRate);
        }
    }
    sprite: string;
    frameRate: number;
}
Effect.fieldName = 'effects';


// Go ahead and load all data here so everyone
// can use the same copy
var gamedata = require('json-loader!../data-loader!../data');
export var universe = createObjects(gamedata);
