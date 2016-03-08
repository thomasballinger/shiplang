var setup = require('./setup');
import { SpaceDisplay } from './display';
import { Profile } from './profile';
import { Lerper, FPS } from './hud';
import { Updater } from './updater';
import { Engine } from './engine';
import * as errorbar from './errorbar';
import { AceJS } from './editors';

import { Updateable, Selection, Scenario } from './interfaces';
import { Ship } from './entity';


export function simulator(originalWorld: Engine){

// document body fullscreen
//document.body.addEventListener('click', function(e){
//  setup.makeFullscreen(document.body);
//});

  var canvas = <HTMLCanvasElement>document.getElementById('canvas');
  canvas.classList.toggle('grid-background');

  canvas.focus();

  var editor = new AceJS();

  var updater = new Updater(
    (<any>window).DEBUGMODE ? function(e){ throw e; } : errorbar.setError,
    errorbar.clearError,
    function(msg){}, // queue warning
    function(){ return editor.getCode(); },
    'canvas', // where to put key handlers
    originalWorld, // updater holds on to a copy of this to reset
    'JavaScript',
    function(){ editor.clearAllHighlights(); },
    function(id: string, selections: Selection[]){
        return editor.setHighlight(id, selections);
    },
    true,
    function(e: Ship){
        if (e !== undefined && e.context !== undefined &&
            (<any>e).context.highlightId !== undefined){
            editor.setHighlightedEntity((<any>e).context.highlightId);
        }
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
    lurper: new Lerper('player-shields', '#44cc00'),
    update: function(player, world){ this.lurper.update(player.shields, player.shieldsMax); }
  });
  updater.registerObserver(<Updateable>{
    hud: new FPS('fps'),
    update: function(player, world){ this.hud.tick('ships: '+world.entities.length); }
  });

  setup.stealSimulatorKeys(updater);
  setup.stealDebugKeys(updater);

  function tick(){
    var tickTime = updater.tick(0.032); // 30fps
    setTimeout(tick, Math.max(5, 33.5-tickTime));
  }

  editor.setCode(Profile.fromStorage().script);
  tick();
}
