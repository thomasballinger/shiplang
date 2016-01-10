;(function() {
  'use strict';

  function thrustFor(entity, x){
    entity.thrust = 0.1;

    t0 = new Date().getTime();
    function doneWaiting(){
      if (new Date().getTime() > t0 + (x * 1000)){
        entity.thrust = 0;
        return true;
      }
      return false;
    }
    return doneWaiting;
  }

  function detonate(entity, x){
    entity.type = 'explosion';
    entity.r = 10;
  }

  function runEntityScript(e){
    if (e.readyCallback === 'done'){
      return;
    }
    if (e.scriptInProgress === undefined){
      if (e.script === undefined){
        throw Error("need script to run");
      }
      e.scriptInProgress = e.script();

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


  var AI = {};
  AI.runEntityScript = runEntityScript;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = AI;
    }
  } else {
    window.AI = AI;
  }
})();
