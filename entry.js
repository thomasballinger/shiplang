require("./style.css");

import { simulator } from './simulator';
import { outerspace } from './outerspace';
import { Player } from './player';
import { earth } from './story';

window.deepcopy = require('./deepcopy'); // needed by JS interpreter
window.Player = Player; // for convenience in onClicks of links

routes = {
  'simulator': simulator,
  'Sol': outerspace,
  'earth': earth,
  '': function(){ return outerspace('You are a gunner. A space gunner. Press space to gun.'); },
  'outfitter?': function(){'nop';}
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
  var player = Player.fromStorage();
  routes[player.location]();
}

main();
