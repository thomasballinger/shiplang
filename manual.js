'use strict';

function Controls(obj){
  this.events = [];
  this.initialize(obj);
}
Controls.prototype.getEvent = function*(){
  var events = this.events;
  yield function(){
    return events.length > 0;
  };
  while (this.events.length > 2 &&
      this.events[0].keyCode === this.events[1].keyCode &&
      this.events[0].type === 'keydown' &&
      this.events[1].type === 'keydown'){
    console.log('cleaned', this.events.shift());
  }
  return this.events.shift();
};
Controls.prototype.initialize = function(obj){
  var events = this.events;
  obj.addEventListener('keydown', function(e){
    events.push(e);
    if ([37, 38, 29, 40, // arrows
        32, // spacebar
        70 // f
        ].indexOf(e.keyCode) != -1){
      //e.preventDefault(); no longer required?
      return false;
    }
  });
  obj.addEventListener('keyup', function(e){
    events.push(e);
    return false;
  });
};

function* actOnKey(e, controls){
  var event = yield* controls.getEvent();
  switch(event.keyCode){
    case 38:
      if (event.type === 'keydown'){
        e.thrust = e.maxThrust;
      } else if (event.type === 'keyup'){
        e.thrust = 0;
      }
      break;
    case 37:
      if (event.type == 'keydown'){
        e.dh = -e.maxDH;
      } else if (event.type == 'keyup'){
        e.dh = 0;
      }
      break;
    case 39:
      if (event.type == 'keydown'){
        e.dh = e.maxDH;
      } else if (event.type == 'keyup'){
        e.dh = 0;
      }
      break;
    case 40:
      if (event.type == 'keydown'){
        e.hTarget = (e.vHeading() + 180) % 360;
      } else if (event.type == 'keyup'){
        e.hTarget = undefined;
      }
      break;
    case 32:
      if (event.type == 'keydown'){
        return 'space';
      }
      break;
    case 70:
      if (event.type == 'keydown'){
        return 'f';
      }
      break;
  }
}

var Manual = {};
Manual.Controls = Controls;
Manual.actOnKey = actOnKey;

module.exports = Manual;
