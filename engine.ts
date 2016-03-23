import { Entity, Ship as ShipEntity, SpobEntity, Component } from './entity';
import { x_comp, y_comp, dist } from './shipmath';
import * as scriptEnv from './scriptenv';
import { Event, EventType } from './mission';
import { isEnemy, govModReputation } from './governments';
import { Profile } from './profile';
import { Fleet, System, Ship, universe } from './universe';
import { chooseScript } from './ai';

var deepcopy = (<any>window).deepcopy;

import { GameTime, Script, ShipSpec } from './interfaces';

var IMMUNITY_TIME_S = 1;


//TODO move these helpers to something to do with entities - engine is more top-level.
export function makeShipEntity(kind: Ship, x: number, y: number, h: number, script?: Script){
    if (kind.isComponent){
        var ship = <ShipEntity>(new Component(kind, x, y, script));
    } else {
        var ship = new ShipEntity(kind, x, y, script);
    }
    ship.h = h;
    return ship;
}

function makeMissile(x: number, y: number, dx: number, dy: number, h: number, ship: Ship, script: Script){
    var missile = new ShipEntity(ship, x, y, script);
    missile.dx = dx;
    missile.dy = dy;
    missile.r = 3;
    missile.h = h;
    return missile;
}

function fireMissile(e:Entity, ship: Ship, script: Script, t:GameTime){
    var missile = makeMissile(e.x + x_comp(e.h)*e.r,
                              e.y + y_comp(e.h)*e.r,
                              e.dx + x_comp(e.h) * 10,
                              e.dy + y_comp(e.h) * 10,
                              e.h, ship, script);
    missile.firedBy = e;
    missile.firedAt = t;
    missile.government = e.government;
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
    laser.government = e.government;
    return laser;
}

export function makePlanet(x: number, y: number, r: number, sprite: string){
    var planet = new SpobEntity('planet', x, y, 0, 0, r);
    planet.drawStatus['sprite'] = sprite
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


export class Engine{
    constructor(public system: System, public profile: Profile){
        this.entities = [];
        this.bgEntities = [];
        this.gameTime = 0;
        this.inTick = false;
        this.profile = profile
        this.system = system
        this.playerAdded = false;
        this.initialize();
    }
    entities: Entity[];
    bgEntities: Entity[];
    gameTime: GameTime;
    inTick: boolean;
    playerAdded: boolean;
    initialize(){
        // for deepcopy instantiation with undefined
        if (this.system === undefined){ return; }

        this.system.createPlanets(this, this.profile);
        this.system.createInitialFleets(this, this.profile);
    }
    addPlayer(script: any){
        if (this.playerAdded){ throw Error("Player already added"); }
        if (this.system === undefined){ throw Error("Engine needs a system"); }
        if (this.profile === undefined){ throw Error("Engine needs a profile"); }
        this.system.createPlayerShipEntity(this, this.profile, script);
        this.playerAdded = true;
    }
    static fromStart(startName: string){
        var seed = Math.random();
        var start = universe.starts[startName];
        if (start === undefined){ throw Error("can't find start "+startName+" in "+Object.keys(universe.starts)); }
        Profile.clear()
        return new Engine(start.system, start.buildProfile().save());
    }
    static fromProfile(profile: Profile){

    }
    entitiesToDraw(): Entity[]{
        return [].concat(this.bgEntities, this.entities);
    }
    copy():Engine{
        //var t0 = window.performance.now();
        var world = deepcopy(this);
        //console.log(window.performance.now() - t0);
        return world;
    }
    fireMissile(entity:Entity, ship: Ship, script: Script, color:string){
        var missile = fireMissile(entity, ship, script, this.gameTime);
        missile.drawStatus['color'] = color;
        this.addEntity(missile);
    }
    fireLaser = function(entity: Entity, color: string, intensity?: number){
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
    addEntities(entities: Entity[]){
        entities.map(function(e){
            this.entities.push(e);
        });
    }
    addBackgroundEntity(entity: Entity){
        this.bgEntities.push(entity);
    }
    ships():ShipEntity[]{
        return <ShipEntity[]>this.entities.filter(function(x){return !x.isMunition;});
    };
    munitions(): Entity[]{
        return this.entities.filter(function(x){return x.isMunition;});
    };

    addFleet(fleet: Fleet){
        var script = chooseScript(fleet.government, fleet.personality);
        var specs: Ship[] = fleet.getShips();
        for (var spec of specs){
            var ship = makeShipEntity(spec, Math.random()*1000,
                                Math.random()*1000, 270, script);
            ship.government = fleet.government;
            this.addEntity(ship);

        }
        //TODO choose a location based on current System
        // set personality fields on entities
    }

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
            var [entity, explosion] = x
            return !!entity;
        });

        var EXPLOSION_DAMAGE = 3;
        touchingExplosion.map(function(x: [Entity, Entity]){
            var [entity, explosion] = x;
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
            // munitions colliding with any other foreground entities
            // damages the armor of both entity and the munition
            for (var [e, m] of [[e1, e2], [e2, e1]]){
                if (e.type === 'explosion'){ continue; }
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
            if (x.dead && (x instanceof ShipEntity)){
                x.context.cleanup();
            }
            return x.dead !== true;
        });
        return events;
    }
    // doesn't include passed in entity
    enemyCount = function(e1: Entity){
        return this.entities.filter(function(x: Entity){
            return isEnemy(e1, x);
        }).length
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
    findClosestEnemy = function(e1: Entity){
        return this.findClosest(e1, this.ships().filter(function(x: Entity){
            return isEnemy(e1, x);
        }));
    }
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

        if (this.system){
            // can be created without a system for testing
            this.system.createFleets(this, dt);
        }

        this.entities.map(function(x: Entity){ x.move(dt); });
        var events = this.checkCollisions();
        var profile = this.profile;
        events.map(function(e: Event){ govModReputation(e, profile); });
        events.map(function(e: Event){
            profile.missions.map(function(m){
                m[0].processEventMethod(e, m[1]);
            });
        });
        //console.log(events)
        // Tell missions about events
        // Tell governments about events
        // (these are all to do with the profile)

        // Run ai for each ship
        scriptEnv.setGameWorld(this);
        scriptEnv.setProfile(this.profile);
        for (var i=0; i<this.entities.length; i++){
            var e = this.entities[i];
            if ((<any>e).context === undefined){ continue; }
            scriptEnv.setCurrentEntity(e);
            scriptEnv.setGameTime(this.gameTime);
            var success = (<any>e).context.safelyStep(e, setError);
        }

        this.inTick = false;
    }
    getPlayer():ShipEntity{
        return <ShipEntity>this.entities.filter(function(x){return x.imtheplayer;})[0];
    }
    getAttached(e: ShipEntity): Component[]{
        return <Component[]>this.entities.filter(function(x){ return x.attachedTo === e; });
    }

    deepCopyCreate():Engine{
        if (this.inTick){ throw Error("Engine can't be copied during a tick!"); }
        return new (<any>this).constructor(undefined, undefined);
    };
    deepCopyPopulate = function(copy: Engine, memo:any, innerDeepCopy:any){
        copy.entities = innerDeepCopy(this.entities, memo);
        copy.bgEntities = innerDeepCopy(this.bgEntities, memo);
        copy.gameTime = this.gameTime;
        copy.profile = innerDeepCopy(this.profile, memo);
        copy.system = this.system;
        copy.playerAdded = this.playerAdded;
    };
}
