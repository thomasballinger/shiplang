import { Entity, Ship, Spob, Component } from './entity';
import { x_comp, y_comp, dist } from './shipmath';
import * as ships from './ships';
import * as scriptEnv from './scriptenv';
import { Event, EventType } from './mission';

var deepcopy = (<any>window).deepcopy;

import { GameTime, Script, ShipSpec } from './interfaces';


var IMMUNITY_TIME_S = 1;

export function makeBoid(x:number, y:number, dx:number, dy:number, h:number, dh:number, script: Script){
    var boid = new Ship(ships.Boid, x, y, script);
    boid.dx = dx;
    boid.dy = dy;
    boid.dh = dh;
    boid.h = h;
    return boid;
}

export function makeShip(kind: ShipSpec, x: number, y: number, h: number, script?: Script){
    var ship = new Ship(kind, x, y, script);
    ship.h = h;
    return ship;
}

export function makeComponent(kind: ShipSpec, x: number, y: number, h: number, script: Script): Ship{
    var ship = new Component(kind, x, y, script);
    ship.h = h;
    return <Ship>ship;
}

function makeMissile(x: number, y: number, dx: number, dy: number, h: number, ship: ShipSpec, script: Script){
    var missile = new Ship(ship, x, y, script);
    missile.dx = dx;
    missile.dy = dy;
    missile.r = 3;
    missile.h = h;
    return missile;
}

function fireMissile(e:Entity, ship: ShipSpec, script: Script, t:GameTime){
    var missile = makeMissile(e.x + x_comp(e.h)*e.r,
                              e.y + y_comp(e.h)*e.r,
                              e.dx + x_comp(e.h) * 10,
                              e.dy + y_comp(e.h) * 10,
                              e.h, ship, script);
    missile.firedBy = e;
    missile.firedAt = t;
    return missile;
}

function fireLaser(e:Entity, gameTime:GameTime){
    var laser = new Entity('laser',
                           e.x + x_comp(e.h)*e.r,
                           e.y + y_comp(e.h)*e.r,
                           e.dx + x_comp(e.h) * 600,
                           e.dy + y_comp(e.h) * 600,
                           2);
    laser.firedBy = e;
    laser.firedAt = Number.MAX_VALUE;  // never damages owner
    laser.timeToDie = gameTime + 1.5;
    laser.isMunition = true;
    return laser;
}

export function makePlanet(x: number, y: number, r: number, color?: string){
    var planet = new Spob('planet', x, y, 0, 0, r);
    planet.drawStatus['color'] = color
    return planet
}

function beingLaunchedByCollider(pair:[Entity, Entity], gameTime:GameTime):boolean{
    var e1 = pair[0]; var e2 = pair[1];
    if ((e1.firedBy === e2 || (e1.firedBy && e1.firedBy.attachedTo === e2)) &&
        gameTime < e1.firedAt + IMMUNITY_TIME_S &&
        e1.type !== 'explosion'){
            return true;
    }
    if ((e2.firedBy === e1 || (e2.firedBy && e2.firedBy.attachedTo === e1)) &&
         gameTime < e2.firedAt + IMMUNITY_TIME_S &&
         e2.type !== 'explosion'){
        return true;
    }
}


export class System{
    constructor(){
        this.entities = [];
        this.bgEntities = [];
        this.gameTime = 0;
        this.inTick = false;
    }
    entities: Entity[];
    bgEntities: Entity[];
    gameTime: GameTime;
    inTick: boolean;
    entitiesToDraw(): Entity[]{
        return [].concat(this.bgEntities, this.entities);
    }
    copy():System{
        //var t0 = window.performance.now();
        var world = deepcopy(this);
        //console.log(window.performance.now() - t0);
        return world;
    }
    fireMissile(entity:Entity, ship: ShipSpec, script: Script, color:string){
        var missile = fireMissile(entity, ship, script, this.gameTime);
        missile.drawStatus['color'] = color;
        this.addEntity(missile);
    }
    fireLaser = function(entity: Entity, color: string, intensity: number){
        var blast = fireLaser(entity, this.gameTime);
        blast.drawStatus['color'] = color;
        var multiplier = intensity || 1
        blast.damage = 1 * multiplier;
        blast.r = blast.r * Math.pow(Math.max(1, blast.r * multiplier), 2/3)
        this.addEntity(blast);
    }
    addEntity(entity: Entity){
        this.entities.push(entity);
    }
    addBackgroundEntity(entity: Entity){
        this.bgEntities.push(entity);
    }
    ships():Ship[]{
        return <Ship[]>this.entities.filter(function(x){return !x.isMunition;});
    };
    munitions(): Entity[]{
        return this.entities.filter(function(x){return x.isMunition;});
    };
    getCollisionPairs(entities: Entity[]){
        var collisions = <[Entity, Entity][]>[];
        for (var i=0; i<entities.length; i++){
            var e1 = entities[i];
            for (var j=i+1; j<entities.length; j++){
                var e2 = entities[j];
                if (Math.pow(e1.x - e2.x, 2) + Math.pow(e1.y - e2.y, 2) < (Math.pow(e1.r + e2.r, 2))){
                    collisions.push([e1, e2]);
                }
            }
        }
        return collisions;
    }

    // Entities that explode pass through these stages:
    //
    //  type     | .dead | .inactive
    // ----------+-------+----------
    //   ?       | false | false
    //  type changed to explosion because armor becomes <= 0
    // explosion | false | false    type changed to explosion
    //  after the explosion gets a chance to collide, inactivated
    // explosion | false | true
    //  once the explosion's radius gets too small marked for removal
    // explosion | true  | true
    //  this causes the entity to be removed from the world.entities list
    //
    checkCollisions(): Event[]{
        var gameTime = this.gameTime;
        var events: Event[] = [];

        // eliminate old explosions and other things fading away
        var activeEntities = this.entities.filter(function(x){return !x.inactive;});

        var collisions = this.getCollisionPairs(activeEntities);
        var touchingExplosion = collisions.map(function(x){
            var e1 = x[0]; var e2 = x[1];
            if (e1.type === 'explosion' && e2.type === 'explosion'){return undefined;}
            if (e1.type !== 'explosion' && e2.type !== 'explosion'){return undefined;}
            if (e1.type === 'explosion'){ return [e2, e1]; }
            if (e2.type === 'explosion'){ return [e1, e2]; }
            throw Error('I thought that was exhaustive...');
        }).filter(function(x: [Entity, Entity]){
            if (x === undefined){ return false; }
            var entity: Entity = x[0];
            return !!entity;
        });

        var EXPLOSION_DAMAGE = 3;
        touchingExplosion.map(function(x: [Entity, Entity]){
            var entity: Entity = x[0]
            var explosion: Entity = x[1]
            entity.takeDamage(EXPLOSION_DAMAGE);
            if (explosion.firedBy){
                events.push(new Event(
                    entity.armor > 0 ? EventType.Provoke : EventType.Kill,
                    explosion.firedBy, entity));
            }
        });

        // Inactivate explosions that have already had a frame to cause damage
        activeEntities.filter(function(e){
            return e.type === 'explosion';
        }).map(function(e){ e.inactive = true; });

        // Now cause new explosions of munitions
        var weaponCollisions = collisions.filter(function(x){
            return (x[0].isMunition || x[1].isMunition);
        }).filter(function(x){ return !beingLaunchedByCollider(x, gameTime);});

        for (var k=0; k<weaponCollisions.length; k++){
            var e1: Entity = weaponCollisions[k][0]
            var e2: Entity = weaponCollisions[k][1]
            // munitions colliding with any other forground entities
            // damages the armor of both entity and the munition
            for (var [e, m] of [[e1, e2], [e2, e1]]){
                e.takeDamage(Math.max(1, m.damage || 0));
                if (m.firedBy){
                    events.push(new Event(
                        e.armor > 0 ? EventType.Provoke : EventType.Kill,
                        m.firedBy, e));
                }
            }
        }

        for (var e of this.entities){
            if (e.armor <= 0 && e.explosionSize > 0 && e.type !== 'explosion'){
                e.r = e.explosionSize;
                e.type = 'explosion';
                e.dx = e.dx/Math.abs(e.dx)*Math.pow(Math.abs(e.dx), 0.2) || 0;
                e.dy = e.dy/Math.abs(e.dy)*Math.pow(Math.abs(e.dy), 0.2) || 0;
            } else if (e.armor <= 0 && !e.inactive){
                e.dead = true;
            }
        }

        // cull small inactive explosions
        this.entities.filter(function(x){
            return x.type === 'explosion' && x.inactive && x.r < 8;
        }).map(function(x){ x.dead = true; });

        // start timers for those that haven't started;
        this.entities.filter(function(x){
            return (x.timeToDie < 0);
        }).map(function(x){ x.timeToDie = gameTime - x.timeToDie; });

        // remove old things
        this.entities.filter(function(x){
            return (x.timeToDie !== undefined && !x.inactive && x.timeToDie < gameTime);
        }).map(function(x){ x.dead = true; });

        this.entities = this.entities.filter(function(x){
            if (x.dead && (x instanceof Ship)){
                x.context.cleanup();
            }
            return x.dead !== true;
        });
        return [new Event(EventType.Provoke, this.entities[0], this.entities[0])];
    }
    // doesn't include passed in entity
    countOfGov = function(e1: Entity, gov: string){
        if (gov === undefined){ throw Error("countOfGov needs two arguments"); }
        return this.entities.filter(function(x: Entity){
            return x.government === gov && x !== e1;
        }).length
    }
    findClosestOfGov = function(e1: Entity, gov: string){
        return this.findClosest(e1, this.ships().filter(function(x: Entity){
            return x.government === gov;
        }));
    }
    findClosestShip = function(e1: Entity){
        return this.findClosest(e1, this.ships());
    };
    findClosestBackgroundEntity = function(e1: Entity){
        return this.findClosest(e1, this.bgEntities);
    };
    findClosestComponent = function(e1: Entity){
        return this.findClosest(e1, this.entities.filter(
            function(x:Entity){ return x.isComponent; }));
    };
    findClosest = function(e1: Entity, candidates?: Entity[]){
        if (candidates === undefined){
            candidates = this.entities;
        }
        var minDist = Number.MAX_VALUE;
        var other = <Entity>undefined;
        for (var i=0; i<candidates.length; i++){
            var e2 = candidates[i];
            if (e1 === e2){ continue; }
            var d = e1.distFrom(e2);
            if (d < minDist){
                minDist = d;
                other = e2;
            }
        }
        return other;
    };
    distToClosest(e: Entity):number{
        var closest = this.findClosest(e);
        if (closest === undefined){
            return Number.MAX_VALUE;
        }
        return dist(closest.x, closest.y, e.x, e.y);
    };
    distToClosestShip(e: Entity):number{
        var closest = this.findClosestShip(e);
        if (closest === undefined){
            return Number.MAX_VALUE;
        }
        return dist(closest.x, closest.y, e.x, e.y);
    };
    findSpobWithIndex(n: number){
        var index = n % this.bgEntities.length;
        return this.bgEntities[index];
    }
    tick(dt:GameTime, setError:(msg: string)=>void){
        this.inTick = true;
        this.gameTime += dt;

        this.entities.map(function(x: Entity){ x.move(dt); });
        var events = this.checkCollisions();
        console.log(events)
        // Tell missions about events
        // Tell governments about events
        // (these are all to do with the player)

        // Run ai for each ship
        scriptEnv.setGameWorld(this);
        for (var i=0; i<this.entities.length; i++){
            var e = this.entities[i];
            if ((<any>e).context === undefined){ continue; }
            scriptEnv.setCurrentEntity(e);
            scriptEnv.setGameTime(this.gameTime);
            var success = (<any>e).context.safelyStep(e, setError);
        }

        this.inTick = false;
    }
    getPlayer():Ship{
        return <Ship>this.entities.filter(function(x){return x.imtheplayer;})[0];
    }

    deepCopyCreate():System{
        if (this.inTick){ throw Error("System can't be copied during a tick!"); }
        return new System();
    };
    deepCopyPopulate = function(copy: System, memo:any, innerDeepCopy:any){
        copy.entities = innerDeepCopy(this.entities, memo);
        copy.gameTime = this.gameTime;
    };
}
