require("./style.css");

window.deepcopy = require('./deepcopy'); // needed by JS interpreter

import { simulator } from './simulator';
import { outerspace, level1 } from './outerspace';
import { Profile } from './profile';
import { earth, tolok } from './story';
import * as scenarios from './scenarios';
import { missions } from './mission';

window.Profile = Profile; // for convenience in onClicks of links

// errors resulting from running user's script
// are throw instead of displayed and ignored
window.DEBUGMODE = true;

var gunnerScript = require("raw!./scripts/gunner.js");

routes = {
  'simulator': simulator,
  'Sol': function(){outerspace(scenarios.sol);},
  'earth': earth,
  'outfitter?': function(){'nop';},
  'level1': function(){
    Profile.fromStorage().set('script', gunnerScript).save();
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
    Profile.clear();
    window.location = window.location.protocol + '//' + window.location.host;
  } else if (cmd === 'simulator'){
    Profile.clear();
    Profile.fromStorage().set('location', 'simulator').set('spaceLocation', [-200, 1300]).save();
    window.location = window.location.protocol + '//' + window.location.host;
  } else if (cmd === 'start'){
    outerspace(function(){ return scenarios.fromBasicStart('gunner'); });
  } else {
    Profile.clear();
    Profile.fromStorage().set('location', 'level1').addMission(new missions.KillFiveAstroidsMission()).save();
    var profile = Profile.fromStorage();
    routes[profile.location]();
  }
}

main();
