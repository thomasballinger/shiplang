;(function() {
  'use strict';

  function thrustFor(entity, x){
    console.log('thrustFor called on', entity, x);
    entity.thrust = 0.1;

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

  function turnLeft(entity, x){
    console.log('turnLeft called on', entity, x);
    var target_h = (entity.h - x) % 360;
    entity.dh = 2;
    function doneWaiting(){
      if (Math.abs(((entity.h - target_h) % 360) - 360) < 5){
        entity.dh = 0;
        return true;
      }
      return false;
    }
    return doneWaiting;
  }

  function detonate(entity){
    entity.type = 'explosion';
    entity.r = 100;
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
    console.log(e.readyCallback);
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
  ai.detonate = detonate;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = ai;
    }
  } else {
    window.ai = ai;
  }
})();
