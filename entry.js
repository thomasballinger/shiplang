require("./style.css");
var pilotScriptSource = require("raw!./pilot.sl");
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
var scenarios = require('./scenarios');

// document body fullscreen
document.body.addEventListener('click', function(e){
  setup.makeFullscreen(document.body);
});


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
window.workspace = workspace;

var codeChanged;

var canvas = document.getElementById('canvas');
var controls = new manual.Controls(canvas);
canvas.focus();
scriptEnv.setKeyControls(controls);

var mainDisplay = new display.SpaceDisplay('canvas');
var minimapDisplay = new display.SpaceDisplay('minimap');
var playerArmorDisplay = new hud.Lerper('player-armor', '#cc8800');
var fps = new hud.FPS('fps');

function saveAndSwapWorld(){
  var newWorld = world.copy();
  setTimeout(function(){swapWorld(newWorld); }, 1000);
}
function swapWorld(newWorld){
  world = newWorld;
  ship = world.getPlayer();
}
//setup.stealBacktick(saveAndSwapWorld);
setup.stealBacktick(function(){swapWorld(savedWorlds[0]);});


var ship;
var world;
var lastValid = {};

var getWorld = scenarios.scenario1();
console.log(scenarios.scenario1.instructions);
function resetState(){
  world = getWorld(lastValid);
  ship = world.getPlayer();
}

savedWorlds = [];

resetState('1');
console.log('editor state change');

function tick(){
  var tickStartTime = new Date().getTime();
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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
  //world.tick(0.016); // 60fps (if the drawing and logic took 0 time)
  world.tick(0.032); // 30fps (if the drawing and logic took 0 time)

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
  setTimeout(tick, Math.max(5, 33.5-tickTime)); // 30 draws per second if drawing took zero time
  //setTimeout(tick, Math.max(5, 16.77-tickTime)); // 60 draws per second if drawing took zero time
  // if tick takes over ~10ms to render, start to slow down simulation
}
tick();
