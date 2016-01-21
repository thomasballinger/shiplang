'use strict';

var Entity = require('./entity').Entity;
var Ship = require('./entity').Ship;
var sm = require('./shipmath');
var ships = require('./ships');
var scriptEnv = require('./scriptenv');

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

function fireMissile(e, script){
  var missile = makeMissile(e.x + sm.x_comp(e.h)*e.r,
                        e.y + sm.y_comp(e.h)*e.r,
                        e.dx + sm.x_comp(e.h) * 10,
                        e.dy + sm.y_comp(e.h) * 10,
                        e.h, script);
  missile.firedBy = e;
  missile.firedAt = new Date().getTime();
  return missile;
}
function fireLaser(e){
  var laser = new Entity('laser',
                        e.x + sm.x_comp(e.h)*e.r,
                        e.y + sm.y_comp(e.h)*e.r,
                        e.dx + sm.x_comp(e.h) * 400,
                        e.dy + sm.y_comp(e.h) * 400,
                        2);
  laser.firedBy = e;
  laser.firedAt = Number.MAX_VALUE;  // never damages owner
  laser.timeToDie = new Date().getTime() + 1500;
  laser.isMunition = true;
  return laser;
}

function SpaceWorld(){
  this.entities = [];
}
SpaceWorld.prototype.addEntity = function(entity){
  this.entities.push(entity);
};
SpaceWorld.prototype.ships = function(){
  return this.entities.filter(function(x){return !x.isMunition;});
};
SpaceWorld.prototype.munitions = function(){
  return this.entities.filter(function(x){return x.isMunition;});
};
SpaceWorld.prototype.checkCollisions = function(){
  var t = new Date().getTime();
  var collisions = [];
  for (var i=0; i<this.entities.length; i++){
    var e1 = this.entities[i];
    for (var j=i+1; j<this.entities.length; j++){
      var e2 = this.entities[j];
      if (e1.r !== undefined && e2 !== undefined &&
          e1.distFrom(e2) < e1.r + e2.r){
        if (e1.firedBy === e2 && t < e1.firedAt + IMMUNITY_TIME_MS){
          if (e1.type !== 'explosion'){
            continue;
          }
        }
        if (e2.firedBy === e1 && t < e2.firedAt + IMMUNITY_TIME_MS){
          if (e2.type !== 'explosion'){
            continue;
          }
        }
        if (e1.isMunition || e2.isMunition){
          collisions.push([i, j]);
        }
      }
    }
  }
  for (var k=0; k<collisions.length; k++){
    for (var index of collisions[k]){
      var e = this.entities[index];
      if (e === null){continue;}
      if (e.explosionSize > 0 && e.type !== 'explosion'){
        e.r = e.explosionSize;
        e.type = 'explosion';
        e.dx = e.dx/Math.abs(e.dx)*Math.pow(Math.abs(e.dx), .2) || 0;
        e.dy = e.dy/Math.abs(e.dy)*Math.pow(Math.abs(e.dy), .2) || 0;
      } else if (e.type !== 'explosion'){
        console.log('killing', e, 'of type', e && e.type);
        e.dead = true;
        this.entities[index] = null;
      }
    }
  }

  // cull explosions (should be moved out of collisions)
  for (var i=0; i<this.entities.length; i++){
    var e = this.entities[i];
    if (e !== null && e.type == 'explosion' && e.r < 10){
      e.dead = true;
      this.entities[i] = null;
    } else if (e !== null && e.type == 'laser' && e.timeToDie < t){
      e.dead = true;
      this.entities[i] = null;
    }
  }
  this.entities = this.entities.filter(function(x){return x !== null;});
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
  for (var i=0; i<this.entities.length; i++){
    var entity = this.entities[i];
    if (entity === undefined){
      throw Error('entity does not exist: ', this.entities);
    }
    entity.move(dt);
  }
  this.checkCollisions();
  for (var i=0; i<this.entities.length; i++){
    var e = this.entities[i];
    scriptEnv.setCurrentEntity(e);
    e.context.step(e);
  }
};

SpaceWorld.prototype.deepCopyCreate = function(){
  return new SpaceWorld();
};
SpaceWorld.prototype.deepCopyPopulate = function(copy, memo, innerDeepCopy){
  copy.entities = innerDeepCopy(this.entities, memo);
};


var Space = {};
Space.makeShip = makeShip;
Space.makeBoid = makeBoid;
Space.SpaceWorld = SpaceWorld;
Space.fireMissile = fireMissile;
Space.fireLaser = fireLaser;

module.exports = Space;
