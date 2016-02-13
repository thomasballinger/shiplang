require("./style.css");

import { simulator } from './simulator';
import { outerspace } from './outerspace';

window.deepcopy = require('./deepcopy'); // needed by JS interpreter

routes = {
  'simulator': simulator,
  'space': outerspace,
  '': function(){ return outerspace('You are a gunner. A space gunner. Press space to gun.'); },
  'outfitter?': function(){'nop';}
};

function getLocation(){
  if(window.location.hash) {
    return window.location.hash.slice(1);
  } else {
    return '';
  }
}

function main(){
  console.log(getLocation());
  routes[getLocation()]();
}

main();
