'use strict';

var sm = require('./shipmath');

//TODO test this
function* slowDownIfWrongWay(e1, e2){
  if (e2 === undefined){ return; }
  var towardsE2 = sm.towardsPoint(e1.x, e1.y, e2.x, e2.y);
  if (!sm.headingWithin(e1.vHeading(), e1.h, 60)){
    yield* thrustUntilStopped(e1);
  }
}

function thrustFor(entity, x){
  entity.thrust = entity.maxThrust;

  var t0 = new Date().getTime();
  function doneWaiting(){
    if (new Date().getTime() > t0 + (x * 1000)){
      entity.thrust = 0;
      return true;
    }
    return false;
  }
  return doneWaiting;
}

function setThrust(entity, x){
  entity.thrust = Math.max(0, Math.min(x, entity.maxThrust));
}

function waitFor(entity, x){
  var t0 = new Date().getTime();
  function doneWaiting(){
    if (new Date().getTime() > t0 + (x * 1000)){
      return true;
    }
    return false;
  }
  return doneWaiting;
}

function turnLeft(entity, x){
  var target_h = ((entity.h - x) + 3600) % 360;
  return turnTo(entity, target_h);
}

function turnRight(entity, x){
  var target_h = ((entity.h + x) + 3600) % 360;
  return turnTo(entity, target_h);
}

function turnTo(entity, x){
  entity.hTarget = x;
  function doneWaiting(){
    return (entity.hTarget === undefined);
  }
  return doneWaiting;
}

function* thrustUntilStopped(e){
  yield turnTo(e, (e.vHeading() + 180) % 360);
  e.thrust = e.maxThrust;
  var lastSpeed = Number.MAX_VALUE;
  function doneWaiting(){
    var speed = Math.sqrt(Math.pow(e.dx, 2) + Math.pow(e.dy, 2));
    if (speed > lastSpeed){
      e.thrust = 0;
      return true;
    } else {
      lastSpeed = speed;
      return false;
    }
  }
  yield doneWaiting;
}

function turnTowardFor(e, h, x){
  e.hTarget = h;
  var t0 = new Date().getTime();
  function doneWaiting(){
    if (new Date().getTime() > t0 + (x * 1000)){
      e.hTarget = undefined;
      return true;
    } else if (e.hTarget === undefined){
      return true;
    } else {
      return false;
    }
  }
  return doneWaiting;
}

function* detonate(entity){
  entity.r = 30;
  entity.type = 'explosion';
  entity.dx = entity.dx/Math.abs(entity.dx)*Math.pow(Math.abs(entity.dx), .2) || 0;
  entity.dy = entity.dy/Math.abs(entity.dy)*Math.pow(Math.abs(entity.dy), .2) || 0;
  yield 'done';
}

function* detonateIfCloserThanFor(e, world, d, x){
  yield waitFor(e, 0.1);
  var t0 = new Date().getTime();
  function doneWaiting(){
    if (new Date().getTime() > t0 + (x * 1000)){
      return true;
    } else if (world.distToClosestShip(e) < d){
      return true;
    } else {
      return false;
    }
  }
  e.armed = true;
  yield doneWaiting;
  e.armed = false;

  if (world.distToClosestShip(e) < d || new Date().getTime() < t0 + (x * 1000)){
    yield* detonate(e);
  }
}

var ai = {};
ai.thrustFor = thrustFor;
ai.turnLeft = turnLeft;
ai.turnRight = turnRight;
ai.turnTo = turnTo;
ai.waitFor = waitFor;
ai.setThrust = setThrust;
ai.detonate = detonate;
ai.detonateIfCloserThanFor = detonateIfCloserThanFor;
ai.turnTowardFor = turnTowardFor;
ai.slowDownIfWrongWay = slowDownIfWrongWay;
ai.thrustUntilStopped = thrustUntilStopped;

module.exports = ai;
