require("./style.css");

import { simulator } from './simulator';
import { outerspace, level1 } from './outerspace';
import { Player } from './player';
import { earth } from './story';
import * as scenarios from './scenarios';

window.deepcopy = require('./deepcopy'); // needed by JS interpreter
window.Player = Player; // for convenience in onClicks of links

window.DEBUGMODE = false;

var gunnerScript = require("raw!./scripts/gunner.js");

routes = {
  'simulator': simulator,
  'Sol': function(){outerspace(scenarios.sol);},
  'earth': earth,
  'outfitter?': function(){'nop';},
  'level1': function(){
    Player.fromStorage().set('script', gunnerScript);
    outerspace(scenarios.gunner);},
};

function getHash(){
  if(window.location.hash) {
    return window.location.hash.slice(1);
  } else {
    return '';
  }
}

function main(){
  cmd = getHash();
  if (cmd === 'reset'){
    Player.clear();
    window.location.hash = '';
  }
  if (cmd === 'simulator'){
    Player.clear();
    window.location.hash = '';
    Player.fromStorage().set('location', 'simulator');
  }
  var player = Player.fromStorage();
  routes[player.location]();
}

main();
