require("./style.css");

window.deepcopy = require('./deepcopy'); // needed by JS interpreter

import { simulator } from './simulator';
import { outerspace, level1 } from './outerspace';
import { Profile } from './profile';
import { earth, tolok } from './story';
import { missions } from './mission';
import { Engine } from './engine';

window.Profile = Profile; // for convenience in onClicks of links

// errors resulting from running user's script
// are throw instead of displayed and ignored
// and player, world, and a few other things
// are made available globally on window
window.DEBUGMODE = true;

function getLocation(){
  if(window.location.search) {
    return window.location.search.slice(1);
  } else {
    return '';
  }
}

function main(){
  cmd = getLocation();
  if (cmd === 'simulator'){
    return simulator(Engine.fromStart('simulator'));
  }
  outerspace(Engine.fromStart(cmd));
}

main();
