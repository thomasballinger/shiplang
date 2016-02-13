var setup = require('./setup');
import { SpaceDisplay } from './display';
import { Player } from './player';
import { Lerper, FPS } from './hud';
import * as scenarios from './scenarios';
import { Updater } from './updater';
import * as errorbar from './errorbar';

import { Updateable, Selection, Scenario } from './interfaces';


export function outerspace(scenario: Scenario){

// document body fullscreen
//document.body.addEventListener('click', function(e){
//  setup.makeFullscreen(document.body);
//});

  var canvas = <HTMLCanvasElement>document.getElementById('canvas');
  canvas.classList.toggle('space-background');

  document.getElementById('spacemessage').hidden = false;
  canvas.focus();

  var updater = new Updater(
    (<any>window).DEBUGMODE ? function(e){ throw e; } : errorbar.setError,
    errorbar.clearError,
    function(msg){}, // queue warning
    function(){ return Player.fromStorage().script; },
    'canvas', // where to put key handlers
    scenario(), // how to contruct a new world
    'JavaScript',
    function(){"cleanup";},
    undefined,
    false
  );

  updater.registerObserver({
    update: function(){
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });
  updater.registerObserver(new SpaceDisplay('canvas', 1, 1, .1));
  updater.registerObserver(new SpaceDisplay('minimap', 0.07, 0.3, 0));
  updater.registerObserver(<Updateable>{
    lurper: new Lerper('player-armor', '#cc8800'),
    update: function(player, world){ this.lurper.update(player.armor, player.armorMax); }
  });
  updater.registerObserver(<Updateable>{
    hud: new FPS('fps'),
    update: function(player, world){ this.hud.tick('ships: '+world.entities.length); }
  });

  updater.notifyOfCodeChange();

  function tick(){
    var tickTime = updater.tick(0.032); // 30fps
    setTimeout(tick, Math.max(5, 33.5-tickTime));
  }
  tick();
}
