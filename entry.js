require("./style.css");
require('brace/mode/scheme');
require('brace/mode/javascript');
require('brace/theme/dawn');

var pilotScriptSource = require("raw!./pilot.js");
var builtinSLScripts = require("raw!./pilot.sl");

var display = require('./display');
var setup = require('./setup');
var hud = require('./hud');
var scenarios = require('./scenarios');
var updater = require('./updater');
var errorbar = require('./errorbar');
var editors = require('./editors');

window.deepcopy = require('./deepcopy'); // needed by JS interpreter

// document body fullscreen
//document.body.addEventListener('click', function(e){
//  setup.makeFullscreen(document.body);
//});

var canvas = document.getElementById('canvas');

errorbar.clearError();
canvas.focus();

setup.stealBacktick();

var editor = new editors.AceJS('editor');

var updater = new updater.Updater(
  errorbar.setError, // alerts user that current code is very wrong
  errorbar.clearError,
  function(msg){}, // queue warning
  function(){ return editor.getCode(); },
  'canvas', // where to put key handlers
  scenarios.scenario1(), // how to contruct a new world
  'JavaScript',
  function(start, finish){ return editor.highlight(start, finish); }
);

editor.setListener(function(){ updater.notifyOfCodeChange(); });

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

editor.setCode(pilotScriptSource);

function tick(){
  var tickTime = updater.tick(0.032); // 30fps
  setTimeout(tick, Math.max(5, 33.5-tickTime));
}
tick();
