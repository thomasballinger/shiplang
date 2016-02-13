var pilotScriptSource = require("raw!./pilot.js");

var setup = require('./setup');
import { SpaceDisplay } from './display';
import { Lerper, FPS } from './hud';
import * as scenarios from './scenarios';
import { Updater } from './updater';
import * as errorbar from './errorbar';
import { AceJS } from './editors';

import { Updateable, Selection } from './interfaces';



export function simulator(message?: string){

// document body fullscreen
//document.body.addEventListener('click', function(e){
//  setup.makeFullscreen(document.body);
//});
  document.getElementById('simulatormessage').hidden = false;

  var canvas = <HTMLCanvasElement>document.getElementById('canvas');
  canvas.classList.toggle('grid-background');

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
    },
    true
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

  function tick(){
    var tickTime = updater.tick(0.032); // 30fps
    setTimeout(tick, Math.max(5, 33.5-tickTime));
  }

  if (message){ alert(message); }
  tick();
}