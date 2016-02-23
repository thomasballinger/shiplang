export var Boid = {
    type: 'boid',
    r: 10,
    maxThrust: 10,
    maxDH: 100,
    maxSpeed: 100,
    isMunition: false,
    explosionSize: 20,
    armorMax: 4,
    isInertialess: false,
    lifespan: <number>undefined,
}

export var Triangle = {
    type: 'triangle',
    r: 10,
    maxThrust: 300,
    maxDH: 200,
    maxSpeed: 300,
    isMunition: false,
    explosionSize: 20,
    armorMax: 20,
    isInertialess: false,
    lifespan: <number>undefined,
}

export var FatTriangle = {
    type: 'fattriangle',
    r: 17,
    maxThrust: 200,
    maxDH: 300,
    maxSpeed: 500,
    isMunition: false,
    explosionSize: 40,
    armorMax: 100,
    isInertialess: false,
    lifespan: <number>undefined,
}

export var Gunship = {
    type: 'gunship',
    r: 3,
    maxThrust: 0,
    maxDH: 0,
    maxSpeed: 0,
    isMunition: false,
    explosionSize: 12,
    armorMax: 20,
    isInertialess: false,
    lifespan: <number>undefined,
}

export var Holder = {
    type: 'holder',
    r: 10,
    maxThrust: 300,
    maxDH: 200,
    maxSpeed: 300,
    isMunition: false,
    explosionSize: 20,
    armorMax: 20,
    isInertialess: false,
    lifespan: <number>undefined,
}

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
