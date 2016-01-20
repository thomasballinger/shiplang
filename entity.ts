var sm = require('./shipmath');


type GameTime = number

// These define a ship type but not its instantaneous properties
export interface ShipSpec {type: string,
                    r: number,
                    maxThrust: number,
                    maxDH: number,
                    maxSpeed: number,
                    explosionSize: number,
                    isMunition: boolean}

// Asteroids, missiles, ships, planets, projectiles.
// If a projectile wouldn't need it, doesn't belong here
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

    towards(e: Entity){
      if (e === undefined){ return 0; }
      return sm.towardsPoint(this.x, this.y, e.x, e.y);
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
    distFrom(e: Entity){
        return sm.dist(this.x, this.y, e.x, e.y);
    }

    move(dt: GameTime):void{
        if (this.type === 'explosion'){
            this.r = Math.max(this.r - 10*dt*this.r, 1);
        }
        this.x += this.dx * dt;
        this.y += this.dy * dt;
    }
}

// Things scripts can be run on, including missiles
export class Ship extends Entity{
    constructor(spec: ShipSpec, x: number, y: number, script: ()=>void){
        super(spec.type, x, y, 0, 0, spec.r);
        this.maxThrust = spec.maxThrust;
        this.maxDH = spec.maxDH;
        this.maxSpeed = spec.maxSpeed;
        this.isMunition = spec.isMunition;
        this.explosionSize = spec.explosionSize;
        if (script === undefined){
            this.readyCallback = 'done';
        } else {
            this.script = script;
        }
        this.thrust = 0;
        this.dh = 0;
        this.hTarget = undefined;
    }
    maxThrust: number;
    maxDH: number;
    maxSpeed: number;
    explosionSize: number;
    script: ()=>void;  // TODO clean readyCallback type up
    readyCallback: (()=>boolean) | string;
    thrust: number;
    dh: number;
    hTarget: number;

    move(dt: GameTime){
        super.move(dt);
        if (this.hTarget !== undefined){
            //TODO move this math to shipmath
            var diff = (this.h - this.hTarget + 3600) % 360;
            var delta = diff <= 180 ? diff : 360 - diff;
            diff = this.hTarget - this.h;
            if (diff > 0 ? diff > 180 : diff >= -180){
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

        if (this.thrust !== undefined){
            if (this.h === undefined){
                throw Error("this.h is not a number: "+this);
            }
            this.dx += sm.x_comp(this.h) * this.thrust * dt;
            this.dy += sm.y_comp(this.h) * this.thrust * dt;
        }
    }
}