require("./style.css");
window.pilotScriptSource = require("raw!./pilot.sl");
var ace = require('brace');
require('brace/mode/scheme');
require('brace/theme/terminal');

var space = require('./space');
var display = require('./display');
var manual = require('./manual');
var evaluation = require('./eval');
var scriptEnv = require('./scriptenv');
var setup = require('./setup');

var scripts = require('./pilot');


//setup.randomizeBackground();
setup.makeFullscreen();
setup.setBackgroundClassToSimulation();



setup.waitForWindow(main);

function main(){

  // so loading in an iframe works
  setup.resizeCanvas();

  var minimap = document.getElementById('minimap');
  minimap.width = 200;
  minimap.height = 200;

  var errorbar = document.getElementById('errorbar');
  function setError(s){
    errorbar.innerHTML = s;
    errorbar.hidden = false;
  }
  function clearError(){ errorbar.hidden = true; }
  clearError();

  var editor = ace.edit('editor');
  editor.getSession().setMode('ace/mode/scheme');
  editor.setTheme('ace/theme/terminal');


  editor.setValue(pilotScriptSource);
  editor.getSession().on('change', function(e) {
    codeChanged = true;
  });
  var codeChanged = true;

  var canvas = document.getElementById('canvas');
  var controls = new manual.Controls(canvas);
  canvas.focus();
  scriptEnv.setKeyControls(controls);

   // global so pilot scripts can reference it
  window.controls = controls;
  window.ai = require('./ai');
  window.manual = require('./manual');
  window.space = require('./space');

  var mainDisplay = new display.SpaceDisplay('canvas');
  var minimapDisplay = new display.SpaceDisplay('minimap');

  var boidArgs = [];
  for (var i=0; i<20; i++){
    boidArgs.push([Math.random()*1000-500,
                   Math.random()*1000-500,
                   Math.random()*10-5,
                   Math.random()*10-5,
                   Math.random() * 360,
                   Math.random() * 100 - 50]);
  }

  function saveAndSwapWorld(){
    var newWorld = world.copy();
    setTimeout(function(){swapWorld(newWorld); }, 1000);
  }
  function swapWorld(newWorld){
    world = newWorld;
    ship = newWorld.entities.filter(function(x){return x.imtheplayer;})[0];
  }
  //setup.stealBacktick(saveAndSwapWorld);
  setup.stealBacktick(function(){swapWorld(savedWorlds[0]);});

  var ship;
  var world;
  function resetState(userScripts){

    console.log('editor state change');

    world = new space.SpaceWorld();

    window.world = world; // global so pilot scripts can reference it

    ship = space.makeShip(-200, 350, 270, userScripts.pilotScript);
    ship.imtheplayer = true;
    ship2 = space.makeShip(-300, 350, 270, userScripts.enemyScript);
    world.addEntity(ship);
    world.addEntity(ship2);
    //world.addEntity(space.makeShip(70, 190, 270, scripts.pilotScript));
    for (var i=0; i<20; i++){
      world.addEntity(space.makeBoid(boidArgs[i][0], boidArgs[i][1], boidArgs[i][2],
                                     boidArgs[i][3], boidArgs[i][4], boidArgs[i][5],
                                     userScripts.enemyScript));
    }
  }
  var last_tick = new Date().getTime();
  var lastValid = {};
  savedWorlds = [];

  function tick(){
    if (codeChanged){
      var s = editor.getValue();
      var c = evaluation.parseOrShowError(s, setError);
      if (c !== undefined){
        clearError();
        var userScripts = scriptEnv.getScripts(s);
        lastValid = userScripts;
        console.log(userScripts);
        resetState(lastValid);
      }
      codeChanged = false;
    }
    var now = new Date().getTime();
    var dt = now - last_tick;
    last_tick = now;
    world.tick(dt / 1000);

    var inSimMode = document.getElementsByClassName('grid-background').length > 0;
    mainDisplay.renderCentered(ship, world.entities, 1, 1, inSimMode ? 1 : 0.1);
    minimapDisplay.renderCentered(ship, world.entities, 0.07, 0.3, 0);
    if (ship.dead){
      resetState(lastValid);
    }
    savedWorlds.push(world.copy());
    if (savedWorlds.length > 100){
      savedWorlds.shift();
    }
    setTimeout(tick, 5);
  }
  tick();
}
