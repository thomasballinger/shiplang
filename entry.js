require("./style.css");

//TODO find/write a loader that just does this
document.getElementById('images').innerHTML = require('raw-loader!./sprite-src-loader!./sprite-loader!./data-loader!./data');

import { simulator } from './src/simulator';
import { outerspace, level1 } from './src/outerspace';
import { Profile } from './src/profile';
import { earth, tolok } from './src/story';
import { missions } from './src/mission';
import { Engine } from './src/engine';
import { universe } from './src/universe';

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
  var cmd = getLocation();
  if (cmd === 'simulator'){
    return simulator(Engine.fromStart('simulator'));
  }
  if (cmd === ''){
    cmd = 'adventure';
  }
  outerspace(Engine.fromStart(cmd));
}

main();
