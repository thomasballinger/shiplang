var pilotScriptSource = require("raw!./pilot.js");
var builtinSLScripts = require("raw!./pilot.sl");

var setup = require('./setup');
import { SpaceDisplay } from './display';
import { Lerper, FPS } from './hud';
import * as scenarios from './scenarios';
import { Updater } from './updater';
import * as errorbar from './errorbar';
import { AceJS } from './editors';

import { Updateable, Selection } from './interfaces';



export function simulator(){

// document body fullscreen
//document.body.addEventListener('click', function(e){
//  setup.makeFullscreen(document.body);
//});

  var canvas = <HTMLCanvasElement>document.getElementById('canvas');

  errorbar.clearError();
  canvas.focus();

  var editor = new AceJS();

  var updater = new Updater(
    //errorbar.setError, // alerts user that current code is very wrong
    function(e){ throw e; },
    errorbar.clearError,
    function(msg){}, // queue warning
    function(){ return editor.getCode(); },
    'canvas', // where to put key handlers
    scenarios.scenario1(), // how to contruct a new world
    'JavaScript',
    function(){ editor.clearAllHighlights(); },
    function(id: string, selections: Selection[]){
        return editor.setHighlight(id, selections);
    }
  );

  editor.setListener(function(){ updater.notifyOfCodeChange(); });

  updater.registerObserver({
    update: function(){
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });
  updater.registerObserver(new SpaceDisplay('canvas', 1, 1, 1));
  updater.registerObserver(new SpaceDisplay('minimap', 0.07, 0.3, 0));
  updater.registerObserver(<Updateable>{
    lurper: new Lerper('player-armor', '#cc8800'),
    update: function(player, world){ this.lurper.update(player.armor, player.armorMax); }
  });
  updater.registerObserver(<Updateable>{
    hud: new FPS('fps'),
    update: function(player, world){ this.hud.tick('ships: '+world.entities.length); }
  });

  setup.stealKeys(updater);

  editor.setCode(pilotScriptSource);

  function tick(){
    var tickTime = updater.tick(0.032); // 30fps
    setTimeout(tick, Math.max(5, 33.5-tickTime));
  }
  tick();
}
