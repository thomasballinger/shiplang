require("./style.css");
window.pilotScriptSource = require("raw!./pilot.js");
var space = require('./space');
var manual = require('./manual');
var scripts = require('./pilot');

function onPageLoad(){
  var controls = new manual.Controls();
  window.controls = controls;

  var display = new space.SpaceDisplay('canvas');
  var minimapDisplay = new space.SpaceDisplay('minimap');
  var world = new space.SpaceWorld();
  window.world = world;

  var ship = space.makeShip(400, 190, 0, 0, 270, scripts.manualDrive);
  world.addEntity(ship);
  world.addEntity(space.makeShip(70, 190, 17, 0.1, 270, scripts.pilotScript));
  for (var i=0; i<20; i++){
    world.addEntity(space.makeBoid(Math.random()*2000-1000, Math.random()*2000-1000, Math.random()*10-5, Math.random()*10-5, scripts.boidScript));
  }
  var last_tick = new Date().getTime();
  var startTime = last_tick;
  var finishTime = undefined;
  function tick(){
    var now = new Date().getTime();
    var dt = now - last_tick;
    last_tick = now;
    world.tick(dt / 1000);
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

    var ctx = canvas.getContext('2d');
    ctx.font = "30px Arial";
    if (world.ships().length === 0){
      if (finishTime === undefined){
        finishTime = new Date().getTime() - startTime;
      }
      ctx.fillStyle = '#eeeeee';
      ctx.fillText("Your time was " + Math.round(finishTime / 1000, 5) + " seconds.", 300, 50);
    } else {
      ctx.fillStyle = '#eeeeee';
      ctx.fillText("Destroy everything. " + (world.ships().length).toString() + " things left. Arrow keys, space and f.", 300, 28);
    }
    var backgroundParallax = 0.1;
    canvas.style.backgroundPosition=''+(0-ship.x*backgroundParallax)+' '+(0-ship.y*backgroundParallax);

    setTimeout(tick, 5);
  }
  tick();
}

window.onPageLoad = onPageLoad;
