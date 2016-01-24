'use strict';

var Entity = require('./entity').Entity;
var Ship = require('./entity').Ship;
var sm = require('./shipmath');
var ships = require('./ships');
var scriptEnv = require('./scriptenv');
var deepcopy = require('./deepcopy');

var IMMUNITY_TIME_MS = 1000;


function makeBoid(x, y, dx, dy, h, dh, script){
  var boid = new Ship(ships.Boid, x, y, script);
  boid.dx = dx;
  boid.dy = dy;
  boid.dh = dh;
  boid.h = h;
  return boid;
}

function makeShip(x, y, h, script){
  var ship = new Ship(ships.Ship, x, y, script);
  ship.h = h;
  return ship;
}

function makeMissile(x, y, dx, dy, h, script){
  var missile = new Ship(ships.Missile, x, y, script);
  missile.dx = dx;
  missile.dy = dy;
  missile.r = 3;
  missile.h = h;
  missile.script = script;
  return missile;
}

function fireMissile(e, script, t){
  var missile = makeMissile(e.x + sm.x_comp(e.h)*e.r,
                        e.y + sm.y_comp(e.h)*e.r,
                        e.dx + sm.x_comp(e.h) * 10,
                        e.dy + sm.y_comp(e.h) * 10,
                        e.h, script);
  missile.firedBy = e;
  missile.firedAt = t;
  return missile;
}
function fireLaser(e, gameTime){
  var laser = new Entity('laser',
                        e.x + sm.x_comp(e.h)*e.r,
                        e.y + sm.y_comp(e.h)*e.r,
                        e.dx + sm.x_comp(e.h) * 600,
                        e.dy + sm.y_comp(e.h) * 600,
                        2);
  laser.firedBy = e;
  laser.firedAt = Number.MAX_VALUE;  // never damages owner
  laser.timeToDie = gameTime + 1.5;
  laser.isMunition = true;
  return laser;
}

function SpaceWorld(){
  this.entities = [];
  this.gameTime = 0;
}
SpaceWorld.prototype.copy = function(){
  var world = deepcopy(this);
  return world;
};
SpaceWorld.prototype.fireMissile = function(entity, script, color){
  var missile = fireMissile(entity, script, this.gameTime);
  missile.drawStatus.color = color;
  this.addEntity(missile);
};
SpaceWorld.prototype.fireLaser = function(entity, script, color){
  var missile = fireLaser(entity, this.gameTime);
  missile.drawStatus.color = color;
  this.addEntity(missile);
};
SpaceWorld.prototype.addEntity = function(entity){
  this.entities.push(entity);
};
SpaceWorld.prototype.ships = function(){
  return this.entities.filter(function(x){return !x.isMunition;});
};
SpaceWorld.prototype.munitions = function(){
  return this.entities.filter(function(x){return x.isMunition;});
};
function getCollisionPairs(entities){
  var collisions = [];
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

function beingLaunchedByCollider(pair, gameTime){
    var e1 = pair[0]; var e2 = pair[1];
    if (e1.firedBy === e2 && gameTime < e1.firedAt + IMMUNITY_TIME_MS &&
        e1.type !== 'explosion'){ return true; }
    if (e2.firedBy === e1 && gameTime < e2.firedAt + IMMUNITY_TIME_MS &&
        e2.type !== 'explosion'){ return true; }
}

// If an entity is an explosion, find collisions to deal damage,
// then set .inactive = true on it so it doesn't keep doing damage.
// .inactive things are NOT CLEANED UP!
// Set .dead = true
// and then inactivate it
SpaceWorld.prototype.checkCollisions = function(){
  var gameTime = this.gameTime;

  // eliminate old explosions and other things fading away
  var activeEntities = this.entities.filter(function(x){return !x.inactive;});

  var collisions = getCollisionPairs(activeEntities);
  var touchingExplosion = collisions.map(function(x){
    var e1 = x[0]; var e2 = x[1];
    if (e1.type === 'explosion' && e2.type === 'explosion'){return undefined;}
    if (e1.type !== 'explosion' && e2.type !== 'explosion'){return undefined;}
    if (e1.type === 'explosion'){ return e2; }
    if (e2.type === 'explosion'){ return e1; }
    throw Error('I thought that was exhaustive...');
  }).filter(function(x){
    return x; });

  var EXPLOSION_DAMAGE = 3;
  touchingExplosion.map(function(x){
    x.armor -= EXPLOSION_DAMAGE;
  });

  // Inactivate explosions that have already had a frame to cause damage
  activeEntities.filter(function(e){
    return e.type === 'explosion';
  }).map(function(e){ e.inactive = true; });

  // Now cause new explosions of munitions
  var weaponCollisions = collisions.filter(function(x){
    return (x[0].isMunition || x[1].isMunition);
  }).filter(function(x){return !beingLaunchedByCollider(x, gameTime);});

  for (var k=0; k<weaponCollisions.length; k++){
    for (var e of weaponCollisions[k]){

      e.armor -= 1; // hitting things causes munitions to lose armor
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

  // cull inactive explosions of size <10
  this.entities.filter(function(x){
    return x.type === 'explosion' && x.inactive && x.r < 10;
  }).map(function(x){ x.dead = true; });

  // remove old laser shots
  this.entities.filter(function(x){
    return (x.type == 'laser' && x.timeToDie < gameTime);
  }).map(function(x){ x.dead = true; });

  this.entities = this.entities.filter(function(x){return x.dead !== true;});
};
SpaceWorld.prototype.findClosestShip = function(e1){
  return this.findClosest(e1, this.ships());
};
SpaceWorld.prototype.findClosest = function(e1, candidates){
  if (candidates === undefined){
    candidates = this.entities;
  }
  var minDist = Number.MAX_VALUE;
  var other = undefined;
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
SpaceWorld.prototype.distToClosest = function(e){
  var closest = this.findClosest(e);
  if (closest === undefined){
    return Number.MAX_VALUE;
  }
  return sm.dist(closest.x, closest.y, e.x, e.y);
};
SpaceWorld.prototype.distToClosestShip = function(e){
  var closest = this.findClosestShip(e);
  if (closest === undefined){
    return Number.MAX_VALUE;
  }
  return sm.dist(closest.x, closest.y, e.x, e.y);
};
SpaceWorld.prototype.tick = function(dt){
  this.inTick = true;

  this.gameTime += dt;
  for (var i=0; i<this.entities.length; i++){
    var entity = this.entities[i];
    if (entity === undefined){
      throw Error('entity does not exist: ', this.entities);
    }
    entity.move(dt);
  }
  this.checkCollisions();
  scriptEnv.setGameWorld(this);
  for (var i=0; i<this.entities.length; i++){
    var e = this.entities[i];
    if (e.context === undefined){ continue; }
    scriptEnv.setCurrentEntity(e);
    scriptEnv.setGameTime(this.gameTime);
    e.context.step(e);
  }
  this.inTick = false;
};

SpaceWorld.prototype.deepCopyCreate = function(){
  if (this.inTick){ throw Error("SpaceWorld can't be copied during a tick!"); }
  return new SpaceWorld();
};
SpaceWorld.prototype.deepCopyPopulate = function(copy, memo, innerDeepCopy){
  copy.entities = innerDeepCopy(this.entities, memo);
  copy.gameTime = this.gameTime;
};


var Space = {};
Space.makeShip = makeShip;
Space.makeBoid = makeBoid;
Space.SpaceWorld = SpaceWorld;

module.exports = Space;
