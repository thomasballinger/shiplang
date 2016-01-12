;(function() {
  'use strict';

  function towards(e1, e2){
    if (e2 === undefined){
      return 0;
    }
    return towardsPoint(e1.x, e1.y, e2.x, e2.y);
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

  function detonate(entity){
    entity.r = 30;
    entity.type = 'explosion';
    entity.dx = entity.dx/Math.abs(entity.dx)*Math.pow(Math.abs(entity.dx), .2) || 0;
    entity.dy = entity.dy/Math.abs(entity.dy)*Math.pow(Math.abs(entity.dy), .2) || 0;
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
  ai.towards = towards;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = ai;
    }
  } else {
    window.ai = ai;
  }
})();
