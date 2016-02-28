import { ShipSpec } from './interfaces';

//Order matters in this file: Ships can only
//inherit with this function using ships defined above them.
function shipWithChanges(parent: any, changes: any): ShipSpec{
    for (var prop in Object.keys(parent)){
        if (!changes.hasOwnProperty(prop)){
            changes[prop] = parent[prop];
        }
    }
    return changes;
}

var SimpleShip = {
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
});

export var Shuttle = shipWithChanges(SimpleShip, {
    type: 'shuttle',
    r: 7,
    maxThrust: 40,
    maxDH: 100,
    maxSpeed: 100,
    explosionSize: 20,
    armorMax: 3,
});

export var Triangle = shipWithChanges(SimpleShip, {
    type: 'triangle',
    r: 10,
    maxThrust: 300,
    maxDH: 200,
    maxSpeed: 300,
    explosionSize: 20,
    armorMax: 20,
});

export var FatTriangle = shipWithChanges(SimpleShip, {
    type: 'fattriangle',
    r: 17,
    maxThrust: 200,
    maxDH: 300,
    maxSpeed: 500,
    explosionSize: 40,
    armorMax: 100,
});

export var Gunship = shipWithChanges(SimpleShip, {
    type: 'gunship',
    r: 3,
    maxThrust: 0,
    maxDH: 0,
    maxSpeed: 0,
    explosionSize: 12,
    armorMax: 20,
});

export var Holder = shipWithChanges(SimpleShip, {
    type: 'holder',
    r: 10,
    maxThrust: 300,
    maxDH: 200,
    maxSpeed: 300,
    explosionSize: 20,
    armorMax: 20,
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
    isInertialess: false,
    lifespan: 20,
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
    isInertialess: true,
    lifespan: 6,
}

export var Astroid = shipWithChanges(SimpleShip, {
    type: 'astroid',
    r: 30,
    maxThrust: 100,
    maxDH: 500,
    maxSpeed: 300,
    explosionSize: 100,
    armorMax: 20,
});

