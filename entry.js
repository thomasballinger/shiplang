require("./style.css");
window.pilotScriptSource = require("raw!./pilot.js");
var ace = require('brace');
require('brace/mode/javascript');
require('brace/theme/monokai');

var space = require('./space');
var manual = require('./manual');

var canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var minimap = document.getElementById('minimap');
minimap.width = 200;
minimap.height = 200;

var editor = ace.edit('editor');
editor.getSession().setMode('ace/mode/javascript');
editor.setTheme('ace/theme/monokai');

editor.setValue(pilotScriptSource);
editor.getSession().on('change', function(e) {
  codeChanged = true;
});
var codeChanged = false;

var controls = new manual.Controls(document.body);

 // global so pilot scripts can reference it
window.controls = controls;
window.ai = require('./ai');
window.manual = require('./manual');
window.space = require('./space');

var display = new space.SpaceDisplay('canvas');
var minimapDisplay = new space.SpaceDisplay('minimap');

var boidArgs = [];
for (var i=0; i<20; i++){
  boidArgs.push([Math.random()*1000-500,
                 Math.random()*1000-500,
                 Math.random()*10-5,
                 Math.random()*10-5,
                 Math.random() * 360,
                 Math.random() * 100 - 50]);
}


//TODO move to display code
function updateDisplays(ship, world){
  var positionScaleFactor = 1;
  var entityScaleFactor = 1;
  display.render(world.entities,
                 ship.x-canvas.width/2/positionScaleFactor,
                 ship.y-canvas.height/2/positionScaleFactor,
                 ship.x+canvas.width/2/positionScaleFactor,
                 ship.y+canvas.height/2/positionScaleFactor,
                 positionScaleFactor,
                 entityScaleFactor);
  var minimapPSF = 0.07;
  var minimapESF = 0.2;
  minimapDisplay.render(world.entities,
                        ship.x-minimap.width/2/minimapPSF,
                        ship.y-minimap.height/2/minimapPSF,
                        ship.x+minimap.width/2/minimapPSF,
                        ship.y+minimap.height/2/minimapPSF,
                        minimapPSF,
                        minimapESF);

  var backgroundParallax = 0.1;
  canvas.style.backgroundPosition=''+(0-ship.x*backgroundParallax)+' '+(0-ship.y*backgroundParallax);
}


var ship;
var world;
function resetState(s){

  try{
    eval(s);
  } catch (e) {
    console.log(e);
    return
  }
  window.s = s;
  var scripts = {};
  scripts.manualDrive = manualDrive;
  scripts.pilotScript = pilotScript;
  scripts.boidScript = boidScript;

  world = new space.SpaceWorld();

  window.world = world; // global so pilot scripts can reference it

  ship = space.makeShip(-200, 350, 0, 0, 270, scripts.pilotScript);
  world.addEntity(ship);
  world.addEntity(space.makeShip(70, 190, 17, 0.1, 270, scripts.pilotScript));
  for (var i=0; i<20; i++){
    world.addEntity(space.makeBoid(boidArgs[i][0], boidArgs[i][1], boidArgs[i][2],
                                   boidArgs[i][3], boidArgs[i][4], boidArgs[i][5],
                                   scripts.boidScript));
  }
}
resetState(editor.getValue());

var last_tick = new Date().getTime();

function tick(){
  if (codeChanged){
    s = editor.getValue();
    resetState(s);
    codeChanged = false;
  }
  var now = new Date().getTime();
  var dt = now - last_tick;
  last_tick = now;
  world.tick(dt / 1000);
  updateDisplays(ship, world);
  if (ship.dead){
    resetState(s);
  }
  setTimeout(tick, 5);
}

tick();
