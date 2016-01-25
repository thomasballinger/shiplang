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
}
export var Ship = {
    type: 'ship',
    r: 10,
    maxThrust: 300,
    maxDH: 300,
    maxSpeed: 300,
    isMunition: false,
    explosionSize: 20,
    armorMax: 20,
    isInertialess: false,
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
}

export var NeedleMissile = {
    type: 'needlemissile',
    r: 10,
    maxThrust: 100,
    maxDH: 300,
    maxSpeed: 350,
    isMunition: true,
    explosionSize: 10,
    armorMax: 1,
    isInertialess: true,
}
