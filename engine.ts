import { Entity, Ship as ShipEntity, SpobEntity, Component, Projectile, EffectEntity } from './entity';
import { x_comp, y_comp, dist } from './shipmath';
import * as scriptEnv from './scriptenv';
import { Event, EventType } from './mission';
import { isEnemy, govModReputation } from './governments';
import { Profile } from './profile';
import { Fleet, System, Ship, Planet, Spob, Effect, universe } from './universe';
import { chooseScript } from './ai';
import { spriteFrames } from './sprite';
//
var deepcopy = require('deepcopy');

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

interface hasXY {
    x: number;
    y: number;
}

interface hasXYR extends hasXY {
    r: number;
}

export class Engine{
    constructor(public system: System, public profile: Profile){

        this.ships = [];
        this.projectiles = [];
        this.shipProjectiles = [];
        this.effects = [];
        this.spobs = []

        this.gameTime = 0;
        this.inTick = false;
        this.profile = profile
        this.system = system
        this.playerAdded = false;
        this.initialize();
    }
    spobs: SpobEntity[];
    ships: ShipEntity[];
    // lasers; collide with ships, asteroids, untargeted shipProjectiles, and targeted shipProjectiles targeting firer
    projectiles: Projectile[];
    // missiles; collide with ships, asteroids, untargeted shipProjectiles, and targeted shipProjectiles targeting firer
    shipProjectiles: ShipEntity[];
    effects: EffectEntity[]

    gameTime: GameTime;
    inTick: boolean;
    playerAdded: boolean;
    /*
    //targeted projectiles and shipProjectiles are not implemented yet
    // collides with targeted ship(s) and asteroids
    targetedProjectiles: Projectile[];
    // targed missiles; collide with targeted ships, asteroids, and untargeted projectiles
    targetedShipProjectiles: ShipEntity[];
    */
    initialize(){
        // for deepcopy instantiation with undefined
        if (this.system === undefined){ return; }

        this.addSystemSpobs(this.system, this.profile.day);
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
        //TODO incorporate this everywhere!
        var seed = Math.random();
        var start = universe.starts[startName];
        if (start === undefined){ throw Error("can't find start "+startName+" in "+Object.keys(universe.starts)); }
        Profile.clear()
        return new Engine(start.system, start.buildProfile().save());
    }
    static fromProfile(profile: Profile){
        return new Engine(profile.location, profile);
    }
    entitiesToDraw(): Entity[]{
        return [].concat(this.spobs, this.ships, this.projectiles, this.effects);
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
        this.shipProjectiles.push(missile);
    }
    fireLaser = function(e: Entity, color: string, intensity?: number){

        var p = new Projectile(e.x + x_comp(e.h)*e.r,
                               e.y + y_comp(e.h)*e.r,
                               e.dx + x_comp(e.h) * 600,
                               e.dy + y_comp(e.h) * 600,
                               e.h, 2, e, this.gameTime, this.gameTime + 1.5, '#aa6611');
        if(intensity !== undefined){
            console.log('ignoring laser intensity');
        }
        this.projectiles.push(p);
    }
    getShips():ShipEntity[]{
        return this.ships;
    };
    getShipsAndShipProjectiles(): ShipEntity[]{
        return [].concat(this.ships, this.shipProjectiles);
    }
    //TODO make sure this is being used reasonably
    munitions(): Entity[]{
        return this.shipProjectiles
    };

    addFleet(fleet: Fleet){
        var script = chooseScript(fleet.government, fleet.personality);
        var specs: Ship[] = fleet.getShips();
        for (var spec of specs){
            var ship = makeShipEntity(spec, Math.random()*1000,
                                Math.random()*1000, 270, script);
            ship.government = fleet.government;
            this.ships.push(ship);

        }
        //TODO choose a location based on current System
        // set personality fields on entities
    }
    addSystemSpobs(system: System, day: number){
        for (var [spob, [x, y]] of system.spobSpots(day)){
            var h = ((Math.atan2(x, -y) * 180 / Math.PI) + 3600) % 360;
            //TODO this is one of many spots with a bad y axis
            this.spobs.push(new SpobEntity(x, y, spob.r, h, spob.sprite, spob.planet ? spob.planet.id : undefined));
            //TODO this radius number should depend on the sprite
        }
    }

    // New collision system:
    // * spobs: planets. No state, just use universe objects
    // * animations: just decoration, don't collide with anything. Planets too.
    // * explosions: check for collisions with damageables one time only
    // * damageables: all ships, asteroids, some munitions (drone missiles)
    //                have outlines to check munition line segments against
    // * munitions: lines segments checked against all damageables.
    //              If a munition is itself damageable, then it has an outline too.


    /** Find first collision item in group 1 has with group 2 */
    getCollisionPairs<A extends hasXYR, B extends hasXYR>(l1: A[], l2: B[]): [A, B][]{
        var collisions = <[A, B][]>[];
        for (var i=0; i<l1.length; i++){
            var e1 = l1[i];
            for (var j=0; j<l2.length; j++){
                var e2 = l2[j];
                if (Math.pow(e1.x - e2.x, 2) + Math.pow(e1.y - e2.y, 2) < (Math.pow(e1.r + e2.r, 2))){
                    collisions.push([e1, e2]);
                }
            }
        }
        return collisions;
    }

    /** each projectile can collide with 0-1 ship */
    getProjectileShipCollisions(projectiles: Projectile[], ships: ShipEntity[]): [Projectile, ShipEntity][]{
        //TODO use line segment collisions instead of distance < 30
        var pairs: [Projectile, ShipEntity][] = [];
        top:
        for (var p of projectiles){
            for (var s of ships){
                if (Math.pow(p.x - s.x, 2) + Math.pow(p.y - s.y, 2) < (Math.pow(30, 2)) &&
                    p.firedBy !== s){
                    pairs.push([p, s]);
                    continue top;
                }
            }
            pairs.push([p, undefined]);
        }
        return pairs;
    }

    /** each projectile can collide with 0-1 ship */
    getShipProjectileCollisions(shipProjectiles: ShipEntity[], ships: ShipEntity[]): [ShipEntity, ShipEntity][]{
        //TODO use line segment collisions instead of distance < 30
        var pairs: [ShipEntity, ShipEntity][] = [];
        top:
        for (var sp of shipProjectiles){
            for (var s of ships){
                if (sp === s){ continue; }
                if (Math.pow(sp.x - s.x, 2) + Math.pow(sp.y - s.y, 2) < (Math.pow(30, 2)) &&
                    sp.firedBy !== s){
                    //TODO make own projectile safely time limited
                    pairs.push([sp, s]);
                    continue top;
                }
            }
            pairs.push([sp, undefined]);
        }
        return pairs;
    }

    checkCollisions(): Event[]{
        var gameTime = this.gameTime;
        var events: Event[] = [];

        // check projectiles collisions with ships + shipProjectiles
        var projectileCollisions = this.getProjectileShipCollisions(this.projectiles, this.getShipsAndShipProjectiles());
        this.projectiles = [];
        for (var [p, s] of projectileCollisions){
            if (s === undefined){
                this.projectiles.push(p);
                continue;
            }
            s.takeDamage(p.damage);
            //TODO add animation here for hit effect
        }

        // check shipProjectiles collisions with ships + shipProjectiles
        var shipProjectileCollisions = this.getShipProjectileCollisions(this.shipProjectiles, [].concat(this.shipProjectiles, this.ships))
        this.shipProjectiles = []
        for (var [sp, s] of shipProjectileCollisions){
            if (s === undefined){
                this.shipProjectiles.push(sp);
                continue
            }
            s.takeDamage(sp.damage);
            //TODO add animation here for hit effect
        }

        // check ships and shipProjectiles for having been destroyed.

        // returns true if alive, creates explosion effect if dead
        var self = this;
        function isAliveElseExplode(s: ShipEntity){
            if (s.armor < 0){
                s.context.cleanup();
                //TODO damage other ships nearby
                self.effects.push(self.explosionFromShip(s));
                return false;
            } else {
                return true;
            }
        }

        this.ships = this.ships.filter(isAliveElseExplode)
        this.shipProjectiles = this.shipProjectiles.filter(isAliveElseExplode)

        // remove expired projectiles
        this.projectiles = this.projectiles.filter(function(x){
            return (x.timeToDie === undefined || x.timeToDie > gameTime);
        });

        return events;
    }
    explosionFromShip(s: ShipEntity): EffectEntity{
        var effect = universe.effects[s.explosionId];
        return new EffectEntity(s.x, s.y, effect.sprite, this.gameTime);
    }
    // doesn't include passed in entity
    enemyCount = function(e1: Entity){
        return this.ships.filter(function(x: ShipEntity){
            return isEnemy(e1, x);
        }).length
    }
    habitablePlanets = function(): SpobEntity[]{
        return this.spobs.filter(function(e: SpobEntity){ return e.landablePlanet; });
    }
    findClosestShip = function(e1: Entity){
        return this.findClosest(e1, this.getShips());
    };
    //TODO change name of method
    findClosestBackgroundEntity = function(e1: Entity){
        return this.findClosest(e1, this.spobs);
    };
    findClosestComponent = function(e1: Entity){
        return this.findClosest(e1, this.entities.filter(
            function(x:Entity){ return x.isComponent; }));
    };
    findClosestEnemy = function(e1: Entity){
        return this.findClosest(e1, this.getShips().filter(function(x: Entity){
            return isEnemy(e1, x);
        }));
    }
    findClosest = function(e1: Entity, candidates?: Entity[]){
        if (candidates === undefined){
            candidates = this.ships;
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
        var index = n % this.spobs.length;
        return this.spobs[index];
    }
    tick(dt:GameTime, setError:(msg: string)=>void){
        var self = this;
        this.inTick = true;
        this.gameTime += dt;

        if (this.system){
            // can be created without a system for testing
            this.system.createFleets(this, dt);
        }

        this.ships.map(function(x: ShipEntity){ x.move(dt); });
        this.shipProjectiles.map(function(x: ShipEntity){ x.move(dt); });
        this.projectiles.map(function(x: Projectile){ x.move(dt); });

        // update effects and remove if expired
        this.effects.map(function(x: EffectEntity){ x.update(self.gameTime); })
        this.effects = this.effects.filter(function(e: EffectEntity){
            return e.frame < spriteFrames(e.sprite);
        });

        var events = this.checkCollisions();
        var profile = this.profile;

        //TODO test this code, currently events are empty
        events.map(function(e: Event){ govModReputation(e, profile); });
        events.map(function(e: Event){
            profile.missions.map(function(m){
                m[0].processEventMethod(e, m[1]);
            });
        });
        //console.log(events)

        // Run ai for each ship
        scriptEnv.setGameWorld(this);
        scriptEnv.setProfile(this.profile);
        for (var e of this.getShipsAndShipProjectiles()){
            scriptEnv.setCurrentEntity(e);
            scriptEnv.setGameTime(this.gameTime);
            var success = e.context.safelyStep(e, setError);
        }

        this.inTick = false;
    }
    getPlayer():ShipEntity{
        return <ShipEntity>this.ships.filter(function(x){return x.imtheplayer;})[0];
    }
    getAttached(e: ShipEntity): Component[]{
        return <Component[]>this.ships.filter(function(x){ return x.attachedTo === e; });
    }

    deepCopyCreate():Engine{
        if (this.inTick){ throw Error("Engine can't be copied during a tick!"); }
        return new (<any>this).constructor(undefined, undefined);
    };
    deepCopyPopulate = function(copy: Engine, memo:any, innerDeepCopy:any){
        copy.ships = innerDeepCopy(this.ships, memo);
        copy.shipProjectiles = innerDeepCopy(this.shipProjectiles, memo);
        copy.projectiles = innerDeepCopy(this.projectiles, memo);
        copy.effects = innerDeepCopy(this.effects, memo);
        copy.spobs = innerDeepCopy(this.spobs, memo);

        copy.gameTime = this.gameTime;
        copy.profile = innerDeepCopy(this.profile, memo);
        copy.system = this.system;
        copy.playerAdded = this.playerAdded;
    };
}
