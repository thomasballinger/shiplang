require("./style.css");

window.deepcopy = require('./deepcopy'); // needed by JS interpreter

import { simulator } from './simulator';
import { outerspace, level1 } from './outerspace';
import { Player } from './player';
import { earth, tolok } from './story';
import * as scenarios from './scenarios';

window.Player = Player; // for convenience in onClicks of links

// errors resulting from running user's script
// are throw instead of displayed and ignored
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
  'tolok': tolok,
  'robo': function(){outerspace(scenarios.robo);},
};

function getLocation(){
  if(window.location.search) {
    return window.location.search.slice(1);
  } else {
    return '';
  }
}

function main(){
  cmd = getLocation();
  if (cmd === 'reset'){
    Player.clear();
    window.location = window.location.protocol + '//' + window.location.host;
  } else if (cmd === 'simulator'){
    Player.clear();
    Player.fromStorage().set('location', 'simulator').set('spaceLocation', [-200, 1300]);
    window.location = window.location.protocol + '//' + window.location.host;
  } else {
    var player = Player.fromStorage();
    routes[player.location]();
  }
}

main();
