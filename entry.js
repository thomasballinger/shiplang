require("./style.css");
window.pilotScriptSource = require("raw!./pilot.sl");
//var ace = require('brace');
//require('brace/mode/scheme');
//require('brace/theme/terminal');
var builtinSLScripts = require("raw!./pilot.sl");

var space = require('./space');
var display = require('./display');
var manual = require('./manual');
var evaluation = require('./eval');
var scriptEnv = require('./scriptenv');
var setup = require('./setup');
var hud = require('./hud');


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
  var playerArmor = document.getElementById('player-armor');
  playerArmor.width = 200;
  playerArmor.height = 20;

  var errorbar = document.getElementById('errorbar');
  function setError(s){
    errorbar.innerHTML = s;
    errorbar.hidden = false;
  }
  function clearError(){ errorbar.hidden = true; }
  clearError();

  //var editor = ace.edit('editor');
  //editor.getSession().setMode('ace/mode/scheme');
  //editor.setTheme('ace/theme/terminal');


  //editor.setValue(pilotScriptSource);
  //editor.getSession().on('change', function(e) {
  //  codeChanged = true;
  //});

  var workspace = Blockly.inject('editor',
      {toolbox: document.getElementById('toolbox')});

  function myUpdateFunction() {
    codeChanged = true;
  }
  workspace.addChangeListener(myUpdateFunction);

  var codeChanged;

  var canvas = document.getElementById('canvas');
  var controls = new manual.Controls(canvas);
  canvas.focus();
  scriptEnv.setKeyControls(controls);

  var mainDisplay = new display.SpaceDisplay('canvas');
  var minimapDisplay = new display.SpaceDisplay('minimap');
  var playerArmorDisplay = new hud.Lerper('player-armor', '#cc8800');
  var fps = new hud.FPS('fps');

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


  var builtinScripts = scriptEnv.getScripts(builtinSLScripts);
  var ship;
  var world;
  function resetState(userScripts){

    var boidScript = userScripts.dosomething || builtinScripts.enemyScript;

    world = new space.SpaceWorld();

    ship = space.makeShip(-200, 350, 270, builtinScripts.pilotScript);
    ship.imtheplayer = true;
    ship2 = space.makeShip(-300, 350, 270, builtinScripts.enemyScript);
    world.addEntity(ship);
    world.addEntity(ship2);
    //world.addEntity(space.makeShip(70, 190, 270, scripts.pilotScript));
    for (var i=0; i<20; i++){
      world.addEntity(space.makeBoid(boidArgs[i][0], boidArgs[i][1], boidArgs[i][2],
                                     boidArgs[i][3], boidArgs[i][4], boidArgs[i][5],
                                     boidScript));
    }
  }
  var lastValid = {};
  savedWorlds = [];

  resetState('1');
  console.log('editor state change');

  function tick(){
    var tickStartTime = new Date().getTime();
    if (codeChanged){
      var code = Blockly.ShipLang.workspaceToCode(workspace);
      //document.getElementById('errorbar').value = code;
      //document.getElementById('errorbar').hidden = false;

      var s = code; //editor.getValue();
      console.log(code);
      var c = evaluation.parseOrShowError(s, setError);
      console.log(c);
      if (c !== undefined){
        clearError();
        try {
          var userScripts = scriptEnv.getScripts(s);
        } catch (e) {
          setError(e.message);
          var userScripts = undefined;
        }
        if(userScripts){
          lastValid = userScripts;
          console.log('resetting world with:', userScripts);
          resetState(lastValid);
        }
      }
      codeChanged = false;
    }
    world.tick(0.016); // 60fps (if the drawing and logic took 0 time)

    var inSimMode = document.getElementsByClassName('grid-background').length > 0;
    mainDisplay.renderCentered(ship, world.entities, 1, 1, inSimMode ? 1 : 0.1);
    minimapDisplay.renderCentered(ship, world.entities, 0.07, 0.3, 0);
    playerArmorDisplay.update(ship.armor, ship.armorMax);
    fps.tick(world.entities.length);
    if (ship.dead){
      resetState(lastValid);
    }
    savedWorlds.push(world.copy());
    if (savedWorlds.length > 100){
      savedWorlds.shift();
    }
    var tickTime = new Date().getTime() - tickStartTime;
    setTimeout(tick, Math.max(5, 16.77-tickTime)); // 60 draws per second if drawing took zero time
    // if tick takes over ~10ms to render, start to slow down simulation
  }
  tick();
}
