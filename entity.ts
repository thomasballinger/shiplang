import * as sm from './shipmath';
import * as ev from './eval';
import * as codetypes from './codetypes';
import * as scriptEnv from './scriptenv';
import { UserFunctionBodies } from './userfunctionbodies';
import { Ship as ShipPrototype } from './universe';
var DEBUGMODE = require('DEBUGMODE');

import { GameTime, Generator, Interpreter, Selection, Script, Context, JSInterpFunction, Gov } from './interfaces';

var SHIELDS_RECHARGE_RATE = 1;

// Asteroids, missiles, ships, planets, projectiles.
// If a projectile wouldn't need it, doesn't belong here
// TODO is this still a thing? Can it be combined with ship?
// composition over inheritance blah blah
export class Entity{
    constructor(type: string, x:number, y:number, dx:number, dy:number, r:number){
        this.type = type;
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.r = r;
        this.h = 0;
        this.destructable = true;
        this.drawStatus = {};
        this.armorMax = 1;
        this.shieldsMax = 0;
        this.armor = this.armorMax;
        this.shields = this.shieldsMax;
        this.randomSeed = Math.random();
        this.weaponCharge = 0;
        this.damage = 0;
        this.landablePlanet = undefined;
    }
    type: string;
    x: number;
    y: number;
    dx: number;
    dy: number;
    r: number;
    h: number;
    isMunition: boolean;
    destructable: boolean;
    timeToDie: GameTime;
    firedAt: GameTime;
    firedBy: Entity;
    drawStatus: {[property:string]: any;}
    armor: number;
    shields: number;
    armorMax: number;
    shieldsMax: number;
    isComponent: boolean;
    randomSeed: number;
    weaponCharge: number;
    damage: number;
    government: Gov;
    landablePlanet: string;

    // some bookkeeping props for the engine
    dead: boolean;     // will be cleaned up this tick
    inactive: boolean; // sticking around for a bit to look pretty
    imtheplayer: boolean; // world resets on player's death
    viewable: boolean;

    attachedTo: Ship;

    [key: string]:any; // so some metaprogramming in scriptenv.ts checks

    towards(e: Entity): number;
    towards(x: number, y: number): number;
    towards(eOrX: Entity|number, y?: number){
      if (eOrX === undefined){ return sm.towardsPoint(this.x, this.y, 0, 0); }
      if (typeof eOrX === 'number' && typeof y === 'number'){
          return sm.towardsPoint(this.x, this.y, eOrX, y);
      } else if (eOrX instanceof Entity){
          return sm.towardsPoint(this.x, this.y, eOrX.x, eOrX.y);
      }
    }
    towardsIn(e: Entity, dt: number){
        return sm.towardsPoint(this.xIn(dt), this.yIn(dt), e.xIn(dt), e.yIn(dt));
    }
    vHeading(){
      return sm.towardsPoint(0, 0, this.dx, this.dy);
    }
    speed(){
      return Math.sqrt(Math.pow(this.dx, 2) + Math.pow(this.dy, 2));
    }
    speedInDirection(h: number){
        var theta = (this.vHeading() + 3600 - h + 180) % 360 - 180;
        return Math.cos(theta) * this.speed();
    }
    distFromSpob(e: SpobEntity){
        return sm.dist(this.x, this.y, e.x, e.y);
    }
    distFrom(e: Entity): number;
    distFrom(x: number, y: number): number;
    distFrom(eOrX: Entity|number, y?: number){
      if (eOrX === undefined){ return 1000000; }
      if (typeof eOrX === 'number' && typeof y === 'number'){
          return sm.dist(this.x, this.y, eOrX, y);
      } else if (eOrX instanceof Entity){
          return sm.dist(this.x, this.y, eOrX.x, eOrX.y);
      }
    }
    distFromIn(e: Entity, dt: number){
        return sm.dist(this.xIn(dt), this.yIn(dt), e.xIn(dt), e.yIn(dt));
    }
    getRandom(){
        var x = Math.sin(this.randomSeed++) * 10000;
        return x - Math.floor(x);
    }

    // assuming constant velocity, predict position
    xIn(dt: GameTime): number{ return this.x + this.dx * dt; }
    yIn(dt: GameTime): number{ return this.y + this.dy * dt; }

    move(dt: GameTime):void{
        if (this.type === 'explosion' && this.inactive){
            this.r = Math.max(this.r - 10*dt*this.r, 1);
        }
        this.x += this.dx * dt;
        this.y += this.dy * dt;
    }
    deepCopyCreate():Entity{
        return new Entity(undefined, undefined, undefined, undefined, undefined, undefined);
    }
    takeDamage(d: number): void{
        var absorbed = Math.min(this.shields, d);
        var pierced = Math.max(0, d - this.shields)
        this.shields -= absorbed;
        this.armor -= pierced;
    }
}

function probablyReturnsGenerators(g:any): g is (e: Entity)=>Generator {
    return typeof g === 'function';
}

// Things scripts can be run on, including missiles
// TODO rename to ShipEntity
export class Ship extends Entity{
    constructor(spec: ShipPrototype, x: number, y: number, script?: Script){
        super(spec.type, x, y, 0, 0, spec.r);
        this.maxThrust = spec.maxThrust;
        this.maxDH = spec.maxDH;
        this.maxSpeed = spec.maxSpeed;
        this.isMunition = spec.isMunition;
        if (script === undefined){
            this.context = new codetypes.NOPContext();
        } else if (Array.isArray(script) && (<any[]>script).length === 3 &&
                   typeof script[0] === 'string' && script[1] instanceof UserFunctionBodies){
            var [source, bodies, highlight] = <[string, UserFunctionBodies, (id: string, selections: Selection[])=>void]><any>script;
            this.context = new codetypes.JSContext(source, bodies, highlight);
            this.viewable = true;
        } else if (Array.isArray(script) && (<any[]>script).length === 2 &&
                   (<any>script)[1].type === 'function'){
            // this one is a "please fork" request: we ought to copy the context
            var [context, func] = <[codetypes.JSContext, JSInterpFunction]>script;
            this.context = context.forkWithFunction(func);
            this.viewable = true;
        } else if (script instanceof ev.CompiledFunctionObject){
            this.context = codetypes.SLContext.fromFunction(script);
        } else if (probablyReturnsGenerators(script)) {
            this.context = new codetypes.JSGeneratorContext(script);
        } else if (typeof script === 'string'){
                throw Error('please compile a function object first instead of passing a string, got: '+script);
                //this.context = new codetypes.SLContext(script, scriptEnv.buildShipEnv());
        } else {
            throw Error('whoops:' + script)
        }
        this.thrust = 0;
        this.dh = 0;
        this.hTarget = undefined;
        this.armorMax = spec.armorMax;
        this.shieldsMax = spec.shieldsMax;
        this.armor = spec.armorMax;
        this.shields = spec.shieldsMax;
        this.isInertialess = spec.isInertialess;
        if (spec.lifespan !== undefined){
            this.timeToDie = -spec.lifespan;
        }
        if (spec.drawStatus){
            for (var key of Object.keys(spec.drawStatus)){
                this.drawStatus[key] = spec.drawStatus[key];
            }
        }

        //TODO some attributes like this don't change,
        //so the shipentitiy

        //Only allowing undefined for deepCopyCreate
        this.explosionId = spec.explode ? spec.explode.id : undefined;

        //Only needed for weapons - maybe there'll be a separate weapon
        //munition entity? It could inherit from ShipEntity?
        this.hitEffectId = undefined;
    }
    maxThrust: number;
    maxDH: number;
    maxSpeed: number;
    thrust: number;
    dh: number;
    hTarget: number;
    isInertialess: boolean;
    viewable: boolean;
    explosionId: string;
    hitEffectId: string;

    context: Context;
    scriptDone: boolean;

    move(dt: GameTime){
        super.move(dt);
        this.shields = Math.min(this.shieldsMax, this.shields + SHIELDS_RECHARGE_RATE*dt);
        if (this.hTarget !== undefined){
            var delta = sm.headingDiff(this.h, this.hTarget)
            if (sm.headingToLeft(this.h, this.hTarget)){
              this.h = (this.h - Math.min(this.maxDH*dt, delta) + 3600) % 360;
            } else {
              this.h = (this.h + Math.min(this.maxDH*dt, delta) + 3600) % 360;
            }
            if (delta < 0.01){
              this.hTarget = undefined;
              this.dh = 0;
            }
        } else if (this.dh !== undefined){
            if (this.h === undefined){
              throw Error("this.h is not a number: "+this);
            }
            this.h += this.dh * dt;
            this.h = (this.h + 3600) % 360;
        }

        if (this.thrust !== undefined && !this.isInertialess){
            if (this.h === undefined){
                throw Error("this.h is not a number: "+this);
            }
            this.dx += sm.x_comp(this.h) * this.thrust * dt;
            this.dy += sm.y_comp(this.h) * this.thrust * dt;
        }

        var speed = this.speed();
        if (this.isInertialess){
            speed = Math.max(this.maxSpeed) + this.thrust * dt;
            this.dx = sm.x_comp(this.h) * speed;
            this.dy = sm.y_comp(this.h) * speed;
        }

        if (speed > this.maxSpeed && !this.isInertialess){
            this.dx = this.dx * (this.maxSpeed / speed);
            this.dy = this.dy * (this.maxSpeed / speed);
        }
        if (isNaN(this.x)){
            1 + 1;
            debugger;
            throw Error('nan value: '+this.x );
        }

    }
    detach(){}
    deepCopyCreate():Ship{
        return new Ship(<ShipPrototype>{}, undefined, undefined, undefined);
    }
    /** Run a command (from the console, for debugging) */
    //relies on some globals lying around that are only
    //there in debug mode
    run(s: string){
        if(DEBUGMODE){
            scriptEnv.setCurrentEntity(this);
            return scriptEnv.controls[s].apply(null, arguments);
        }
    }
}

// scripts can run on these, but movement matches that of another ship
export class Component extends Ship{
    constructor(spec: ShipPrototype, x: number, y: number, script: Script){
        super(spec, x, y, script);
        this.isComponent = true;
    }
    xOffset: number;
    yOffset: number;
    detach(){
        if (this.attachedTo){
            this.attachedTo = undefined;
            this.dx+= Math.random() * 20 - 10;
            this.dy+= Math.random() * 20 - 10;
        }
    }
    move(dt: GameTime){
        this.shields = Math.min(this.shieldsMax, this.shields + SHIELDS_RECHARGE_RATE*dt);
        if (this.attachedTo && this.attachedTo.type !== 'explosion'){
            var h = this.attachedTo.h
            this.x = (this.attachedTo.x +
                      this.xOffset * Math.cos(h * Math.PI / 180) -
                      this.yOffset * Math.sin(h * Math.PI / 180))
            this.y = (this.attachedTo.y +
                      this.xOffset * Math.sin(h * Math.PI / 180) +
                      this.yOffset * Math.cos(h * Math.PI / 180));
            this.h = this.attachedTo.h;
            this.dx = this.attachedTo.dx; // not used to move, but
            this.dy = this.attachedTo.dy; // needed for projectiles
            this.dh = this.attachedTo.dh; // and for floating
        } else {
            this.x += this.dx * dt
            this.y += this.dy * dt
            this.h += this.dh * dt
            this.dx = this.dx * .99;
            this.dy = this.dy * .99;
        }
        if (this.type === 'explosion'){ //TODO factor this out, it's repeated code
            this.r = Math.max(this.r - 10*dt*this.r, 1);
        }
    }
    deepCopyCreate():Ship{
        return new Ship(<ShipPrototype>{}, undefined, undefined, undefined);
    } //TODO figure out the typescript way to use the correct constructor in the superclass
}

export class Projectile{
    constructor(
        public x: number,
        public y: number,
        public dx: number,
        public dy: number,
        public h: number,
        public damage: number,
        public firedBy: Entity,
        public firedAt: GameTime,
        public timeToDie: GameTime,
        public color: string){
    }

    lineSegment(dt: number): [[number, number], [number, number]]{
        return [[this.x, this.y], [this.x + dt*this.dx, this.y + dt*this.dy]];
    }
    /** Stretch line back and forwards by dt/2 */
    visualLineSegment(dt: number): [[number, number], [number, number]]{
        return [[this.x - dt*this.dx/2, this.y - dt*this.dy/2],
                [this.x + dt*this.dx/2, this.y + dt*this.dy/2]];
    }
    move(dt: number){
        this.x = this.x + dt*this.dx;
        this.y = this.y + dt*this.dy;
    }
    deepCopyCreate(): Projectile{
        return new Projectile(undefined, undefined, undefined, undefined,
                              undefined, undefined, undefined, undefined,
                              undefined, undefined);
    }
}

export class EffectEntity{
    //TODO for the moment all effects are little explosions
    constructor(
        public x: number,
        public y: number,
        public sprite: string,
        public startedAt: GameTime,
        public repeat=false,
        public frameRate=15){
        this.frame = 0;
    }
    // starts at 0, incremented each render
    frame: number;

    update(t: GameTime){
        this.frame = Math.floor((t - this.startedAt) * this.frameRate);
    }

    deepCopyCreate(): EffectEntity{
        return new EffectEntity(undefined, undefined, undefined, undefined, undefined, undefined);
    }
}

//TODO add a link to the Spob object for metadata
export class SpobEntity{
    constructor(public x: number,
                public y: number,
                public r: number,
                public h: number,
                public sprite: string,
                public landablePlanet?: string){
    }
    deepCopyCreate():SpobEntity{
        return new SpobEntity(undefined, undefined, undefined, undefined, undefined, undefined);
    }
}
