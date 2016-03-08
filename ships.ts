import { ShipSpec, ShipSpecChanges, Gov } from './interfaces';

declare module "./interfaces" {
    interface ShipSpec {
        [prop: string]: any;
    }
    interface ShipSpecChanges {
        [prop: string]: any;
    }
}

//Order matters in this file: Ships can only
//inherit with this function using ships defined above them.
function shipWithChanges(parent: ShipSpec, changes: ShipSpecChanges): ShipSpec{
    for (var prop of Object.keys(parent)){
        if (!changes.hasOwnProperty(prop)){
            changes[prop] = parent[prop];
        }
    }
    return <ShipSpec>changes;
}

var SimpleShip: ShipSpec= {
    type: 'boid',
    r: 10,
    maxThrust: 100,
    maxDH: 100,
    maxSpeed: 100,
    explosionSize: 20,
    armorMax: 1,
    shieldsMax: 0,
    government: Gov.Trader,
    isMunition: false,
    isInertialess: false,
    lifespan: <number>undefined,
}

export var Boid = shipWithChanges(SimpleShip, {
    type: 'boid',
    r: 10,
    maxThrust: 10,
    maxDH: 100,
    maxSpeed: 100,
    explosionSize: 20,
    armorMax: 4,
    government: Gov.Trader,
});

export var Shuttle = shipWithChanges(SimpleShip, {
    type: 'shuttle',
    r: 7,
    maxThrust: 40,
    maxDH: 100,
    maxSpeed: 100,
    explosionSize: 20,
    armorMax: 3,
    government: Gov.Trader,
});

export var Triangle = shipWithChanges(SimpleShip, {
    type: 'triangle',
    r: 10,
    maxThrust: 300,
    maxDH: 200,
    maxSpeed: 300,
    explosionSize: 20,
    armorMax: 20,
    government: Gov.Pirate,
});

export var FatTriangle = shipWithChanges(SimpleShip, {
    type: 'fattriangle',
    r: 17,
    maxThrust: 200,
    maxDH: 300,
    maxSpeed: 500,
    explosionSize: 40,
    armorMax: 100,
    government: Gov.Pirate
});

export var Gunship = shipWithChanges(SimpleShip, {
    type: 'gunship',
    r: 3,
    maxThrust: 0,
    maxDH: 0,
    maxSpeed: 0,
    explosionSize: 12,
    armorMax: 20,
    government: Gov.Player,
    isComponent: true,
});

export var Holder = shipWithChanges(SimpleShip, {
    type: 'holder',
    r: 10,
    maxThrust: 300,
    maxDH: 200,
    maxSpeed: 300,
    explosionSize: 20,
    armorMax: 20,
    government: Gov.Cleanup,
});

export var DroneMissile = {
    type: 'dronemissile',
    r: 10,
    maxThrust: 300,
    maxDH: 300,
    maxSpeed: 350,
    isMunition: true,
    explosionSize: 30,
    armorMax: 1,
    shieldsMax: 0,
    isInertialess: false,
    lifespan: 20,
    government: <Gov>undefined,
}

export var NeedleMissile = {
    type: 'needlemissile',
    r: 10,
    maxThrust: 100,
    maxDH: 400,
    maxSpeed: 400,
    isMunition: true,
    explosionSize: 10,
    armorMax: 1,
    shieldsMax: 0,
    isInertialess: true,
    lifespan: 6,
    government: <Gov>undefined,
}

export var Astroid = shipWithChanges(SimpleShip, {
    type: 'astroid',
    r: 30,
    maxThrust: 100,
    maxDH: 500,
    maxSpeed: 300,
    explosionSize: 100,
    armorMax: 20,
    shieldsMax: 0,
    government: Gov.Debris,
});

