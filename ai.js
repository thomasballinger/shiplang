;(function() {
  'use strict';

  function towards(e1, e2){
    if (e2 === undefined){
      return 0;
    }
    return towardsPoint(e1.x, e1.y, e2.x, e2.y);
  }

  function vHeading(e){
    return towardsPoint(0, 0, e.dx, e.dy);
  }

  function speed(e){
    return Math.sqrt(Math.pow(e.dx, 2) + Math.pow(e.dy, 2));
  }

  //TODO test this
  function headingWithin(h1, h2, dh){
    return (Math.abs(h1 - h2) < dh || Math.abs(h1 + 360 - h2) < dh ||
            Math.abs(h1 - (h2 + 360)) < dh);
  }

  function* slowDownIfWrongWay(e1, e2){
    var towardsE2 = towardsPoint(e1.x, e1.y, e2.x, e2.y);
    if (!headingWithin(vHeading(e1), e1.h, 60)){
      console.log('reverse thrust until stopped...')
      yield* thrustUntilStopped(e1);
      console.log('should be stopped...')
    }
  }

  function towardsPoint(p1, p2, x2, y2){
    // works with 2 or 4 arguments
    var x1, y1;
    if (x2 === undefined && y2 === undefined) {
      x1 = p1[0];
      y1 = p1[1];
      x2 = p2[0];
      y2 = p2[1];
    } else {
      x1 = p1;
      y1 = p2;
    }
    var dx = x2 - x1;
    var dy = y2 - y1;
    return (((Math.atan2(dx, -dy) * 180 / Math.PI) + 270 + 360) + 3600) % 360;
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
    yield turnTo(e, (vHeading(e) + 180) % 360);
    e.thrust = e.maxThrust;
    var lastSpeed = Number.MAX_VALUE;
    function doneWaiting(){
      var speed = Math.sqrt(Math.pow(e.dx, 2) + Math.pow(e.dy, 2));
      console.log('current speed:', speed);
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
      } else if (world.distToClosest(e) < d){
        return true;
      } else {
        return false;
      }
    }
    e.armed = true;
    yield doneWaiting;
    e.armed = false;

    if (world.distToClosest(e) < d || new Date().getTime() < t0 + (x * 1000)){
      yield* detonate(e);
    }
  }

  function runEntityScript(e){
    if (e.readyCallback === 'done'){
      return;
    }
    if (e.scriptInProgress === undefined){
      if (e.script === undefined){
        throw Error("need script to run");
      }
      e.scriptInProgress = e.script(e);

    }
    if (e.readyCallback === undefined){
      var request = e.scriptInProgress.next();  /*jshint -W038 */
      if (request.done){
        console.log('script done, it had no async', e);
        e.readyCallback = 'done';
        return;
      }
      e.readyCallback = request.value;
    }
    while (e.readyCallback()){
      request = e.scriptInProgress.next();
      if (request.done){
        console.log('script done for e', e);
        e.readyCallback = 'done';
        break;
      } else {
        e.readyCallback = request.value;
        if (e.readyCallback === 'done'){
          break;
        }
      }
    }
  }


  var ai = {};
  ai.runEntityScript = runEntityScript;
  ai.thrustFor = thrustFor;
  ai.turnLeft = turnLeft;
  ai.turnRight = turnRight;
  ai.turnTo = turnTo;
  ai.waitFor = waitFor;
  ai.setThrust = setThrust;
  ai.detonate = detonate;
  ai.detonateIfCloserThanFor = detonateIfCloserThanFor;
  ai.towards = towards;
  ai.turnTowardFor = turnTowardFor;
  ai.slowDownIfWrongWay = slowDownIfWrongWay;
  ai.thrustUntilStopped = thrustUntilStopped;
  ai.speed = speed;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = ai;
    }
  } else {
    window.ai = ai;
  }
})();
