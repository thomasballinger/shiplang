;(function() {
  'use strict';

  var require;
  if (typeof window === 'undefined') {
    require = module.require;
  } else {
    require = function(name){
      var realname = name.match(/(\w+)[.]?j?s?$/)[1];
      return window[realname];
    };
  }

  function Controls(){
    this.events = [];
    this.initialize();
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
  Controls.prototype.initialize = function(){
    var events = this.events;
    window.addEventListener('keydown', function(e){
      events.push(e);
      if ([37, 38, 29, 40, // arrows
          32 // spacebar
          ].indexOf(e.keyCode) != -1){
        e.preventDefault();
        return false;
      }
    });
    window.addEventListener('keyup', function(e){
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
      case 32:
        if (event.type == 'keydown'){
          return 'space';
        }
        break;
    }
  }

  var Manual = {};
  Manual.Controls = Controls;
  Manual.actOnKey = actOnKey;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Manual;
    }
  } else {
    window.Manual = Manual;
  }
})();
