require("./style.css");
var pilotScriptSource = require("raw!./pilot.sl");
//var ace = require('brace');
//require('brace/mode/scheme');
//require('brace/theme/terminal');
var builtinSLScripts = require("raw!./pilot.sl");

var display = require('./display');
var setup = require('./setup');
var hud = require('./hud');
var scenarios = require('./scenarios');
var updater = require('./updater');
var errorbar = require('./errorbar');

// document body fullscreen
//document.body.addEventListener('click', function(e){
//  setup.makeFullscreen(document.body);
//});

var canvas = document.getElementById('canvas');

errorbar.clearError();
canvas.focus();

//var editor = ace.edit('editor');
//editor.getSession().setMode('ace/mode/scheme');
//editor.setTheme('ace/theme/terminal');

//editor.setValue(pilotScriptSource);
//editor.getSession().on('change', function(e) {
//  codeChanged = true;
//});

var workspace = Blockly.inject('editor',
    {toolbox: document.getElementById('toolbox')});

workspace.addChangeListener(function(){ updater.notifyOfCodeChange(); });

setup.stealBacktick(function(){ updater.rewind(); });

var updater = new updater.Updater(
  errorbar.setError, // alerts user that current code is very wrong
  errorbar.clearError,
  function(msg){}, // queue warning
  function(){ return Blockly.ShipLang.workspaceToCode(workspace); },
  'canvas', // where to put key handlers
  scenarios.scenario1() // how to contruct a new world
);

updater.registerObserver({
  update: function(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});
updater.registerObserver(new display.SpaceDisplay('canvas', 1, 1, 1));
updater.registerObserver(new display.SpaceDisplay('minimap', 0.07, 0.3, 0));
updater.registerObserver({
  lurper: new hud.Lerper('player-armor', '#cc8800'),
  update: function(player, world){ this.lurper.update(player.armor, player.armorMax); }
});
updater.registerObserver({
  hud: new hud.FPS('fps'),
  update: function(player, world){ this.hud.tick(world.entities.length); }
});

function tick(){
  //var tickTime = updater.tick(0.016); // 60fps (if a tick took zero time)
  var tickTime = updater.tick(0.032); // 30fps (if a tick took zero time)

  //setTimeout(tick, Math.max(5, 16.77-tickTime)); // 60 draws per second if drawing took zero time
  setTimeout(tick, Math.max(5, 33.5-tickTime)); // 30 draws per second if drawing took zero time
  // if tick takes over ~28ms to render, start to slow down simulation
}
tick();
