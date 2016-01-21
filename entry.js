require("./style.css");
window.pilotScriptSource = require("raw!./pilot.sl");
var ace = require('brace');
require('brace/mode/scheme');
require('brace/theme/monokai');

var space = require('./space');
var display = require('./display');
var manual = require('./manual');
var evaluation = require('./eval');

var scripts = require('./pilot');

function waitForWindow(func){
  // useful for iframes, for which window.innerWidth is 0 for a while
  function waiter(){
    if (!window.innerWidth){
      setTimeout(waiter, 10);
      return;
    } else {
      console.log(window.innerWidth);
      setTimeout(func, 0);
    }
  }
  waiter();
}

waitForWindow(main);

function main(){

  // so loading in an iframe works

  var canvas = document.getElementById('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

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

  var ship;
  var world;
  function resetState(s){

    console.log('editor state change');

    world = new space.SpaceWorld();

    window.world = world; // global so pilot scripts can reference it

    //ship = space.makeShip(-200, 350, 270, scripts.manualDrive);
    ship = space.makeShip(-200, 350, 270, s);
    world.addEntity(ship);
    //world.addEntity(space.makeShip(70, 190, 270, scripts.pilotScript));
    for (var i=0; i<20; i++){
      world.addEntity(space.makeBoid(boidArgs[i][0], boidArgs[i][1], boidArgs[i][2],
                                     boidArgs[i][3], boidArgs[i][4], boidArgs[i][5],
                                     scripts.boidScript));
    }
  }
  var lastValid = editor.getValue();
  resetState(lastValid);

  var last_tick = new Date().getTime();

  function tick(){
    if (codeChanged){
      var s = editor.getValue();
      var c = evaluation.parseOrShowError(s, setError);
      if (c !== undefined){
        clearError();
        lastValid = s;
        resetState(lastValid);
      }
      codeChanged = false;
    }
    var now = new Date().getTime();
    var dt = now - last_tick;
    last_tick = now;
    world.tick(dt / 1000);
    mainDisplay.renderCentered(ship, world.entities, 1, 1, 0.1);
    minimapDisplay.renderCentered(ship, world.entities, 0.07, 0.2, 0);
    if (ship.dead){
      resetState(lastValid);
    }
    setTimeout(tick, 5);
  }
  tick();
}
