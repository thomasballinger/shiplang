'use strict';

var keyboardMap = require('./keyboardmap').keyboardMap;
var keyCodeFor = require('./keyboardmap').keyCodeFor;

function Controls(obj, delay){
  this.events = [];
  this.pressed = {};
  console.log('delay:', delay);
  this.delay = delay || 0;
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
    var cleaned = this.events.shift();
    //console.log('cleaned', cleaned);
  }
  return this.events.shift();
};
Controls.prototype.getEventOrUndefined = function(){
    if (this.events.length > 0){
      return this.events.shift();
    }
};
Controls.prototype.isPressed = function(key){
  return !!this.pressed[keyCodeFor[key.toUpperCase()]];
};
Controls.prototype.initialize = function(obj){
  var events = this.events;
  var pressed = this.pressed;
  var delay = this.delay;

  obj.addEventListener('keydown', function(e){

    var handler = (function(innerE){
      return function(){
        events.push(innerE);
        pressed[innerE.keyCode] = true;
      };
    })(e);

    if (delay === 0){
      //TODO make delay work in simulator
      // (currently old keystroke will come in late)
      handler();
    } else {
      setTimeout(handler, delay);
    }

    if ([37, 38, 29, 40, // arrows
        32, // spacebar
        8, // backspace
        9, // tab
        ].indexOf(e.keyCode) !== -1){
      e.preventDefault(); // prevents scrolling, back behavior etc.
      //e.stopPropagation();
    }
  });
  /*obj.addEventListener('keydown', function(e){
  }, true); // useCapture true, so on the way down instead of up!
  */
  obj.addEventListener('keyup', function(e){

    var handler = (function(innerE){
      return function(){
        events.push(innerE);
        pressed[innerE.keyCode] = false;
      };
    })(e);

    if (delay === 0){
      handler();
    } else {
      setTimeout(handler, delay);
    }

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
      if (event.type === 'keydown'){
        e.dh = -e.maxDH;
      } else if (event.type === 'keyup'){
        e.dh = 0;
      }
      break;
    case 39:
      if (event.type === 'keydown'){
        e.dh = e.maxDH;
      } else if (event.type == 'keyup'){
        e.dh = 0;
      }
      break;
    case 40:
      if (event.type === 'keydown'){
        e.hTarget = (e.vHeading() + 180) % 360;
      } else if (event.type == 'keyup'){
        e.hTarget = undefined;
      }
      break;
    default: if (event.type === 'keydown'){
      return keyboardMap[event.keyCode];
    }
  }
  return null;
}

var Manual = {};
Manual.Controls = Controls;
Manual.actOnKey = actOnKey;

module.exports = Manual;
