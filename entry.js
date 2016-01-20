require("./style.css");
window.pilotScriptSource = require("raw!./pilot.js");
var space = require('./space');
var manual = require('./manual');
var scripts = require('./pilot');

var canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var minimap = document.getElementById('minimap');
minimap.width = 200;
minimap.height = 200;
document.getElementById('editor').innerHTML = '<code><pre>'+pilotScriptSource+'</pre></code>';

var controls = new manual.Controls();
window.controls = controls; // global so pilot scripts can reference it
var display = new space.SpaceDisplay('canvas');
var minimapDisplay = new space.SpaceDisplay('minimap');

var boidArgs = [];
for (var i=0; i<20; i++){
  boidArgs.push([Math.random()*1000-500, Math.random()*1000-500, Math.random()*10-5, Math.random()*10-5]);
}


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
function resetState(){
  world = new space.SpaceWorld();

  window.world = world; // global so pilot scripts can reference it

  ship = space.makeShip(400, 190, 0, 0, 270, scripts.manualDrive);
  world.addEntity(ship);
  world.addEntity(space.makeShip(70, 190, 17, 0.1, 270, scripts.pilotScript));
  for (var i=0; i<20; i++){
    world.addEntity(space.makeBoid(boidArgs[i][0], boidArgs[i][1], boidArgs[i][2], boidArgs[i][3], scripts.boidScript));
  }
}
resetState();

var last_tick = new Date().getTime();

function tick(){
  var now = new Date().getTime();
  var dt = now - last_tick;
  last_tick = now;
  world.tick(dt / 1000);
  updateDisplays(ship, world);
  if (ship.dead){
    resetState();
  }
  setTimeout(tick, 5);
}

tick();
