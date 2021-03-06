var setup = require('./setup');
import { SpaceDisplay } from './display';
import { Profile } from './profile';
import { Lerper, FPS } from './hud';
import { Updater } from './updater';
import { Engine } from './engine';
import * as errorbar from './errorbar';
import { showMenu, hideMenu } from './pausemenu';
import { Updateable, Selection, Scenario } from './interfaces';
import { showPlanet } from './planetui';
var DEBUGMODE = require('DEBUGMODE');


export function outerspace(originalWorld: Engine){

  // document body fullscreen
  //document.body.addEventListener('click', function(e){
  //  setup.makeFullscreen(document.body);
  //});

  var canvas = <HTMLCanvasElement>document.getElementById('canvas');
  canvas.classList.toggle('space-background');

  canvas.focus();

  var updater = new Updater(
    originalWorld, // updater holds on to a copy of this to reset
    function(){ return Profile.fromStorage().script; },
    false,
    'canvas', // where to put key handlers
    DEBUGMODE ? function(e){ throw e; } : errorbar.setError,
    errorbar.clearError,
    function(msg){}, // queue warning
    'JavaScript',
    function(){"cleanup";},
    undefined
  );

  updater.registerObserver({
    update: function(){
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      map.canvas.width = window.innerWidth;
      map.canvas.height = window.innerHeight;
    }
  });
  var mainDisplay = new SpaceDisplay('canvas', 1, 1);
  updater.registerObserver(<Updateable>{
      display: mainDisplay,
      update: function(player, world){ this.display.update(player, world.entitiesToDraw()); }
  });
  updater.registerObserver(<Updateable>{
      display: new SpaceDisplay('minimap', 0.04, 0.17, true, false),
      update: function(player, world){ this.display.update(player, world.entitiesToDraw()); }
  });
  var map = new SpaceDisplay('map', 1, 1, true, false);
  map.zoomTo(2)
  updater.registerObserver(<Updateable>{
      display: map,
      update: function(player, world){ this.display.update(world.profile.location, world.profile.getSystems()); }
  });
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
    update: function(player, world){ this.hud.tick('ships: '+(world.ships.length + world.shipProjectiles.length)); }
  });

  updater.notifyOfCodeChange();

  var oldZoomTarget: number;
  var fastForward = [false];
  setup.stealDebugKeys(updater, fastForward);
  setup.stealZoomKeys(mainDisplay)
  setup.stealPauseAndMapKeys(function(){
      if (updater.paused){
          hideMenu();
          updater.unpause();
      } else {
          updater.pause();
          showMenu(Profile.fromStorage());
      }
  }, function(){
      if (oldZoomTarget === undefined){
          oldZoomTarget = mainDisplay.zoomTarget;
          mainDisplay.zoomTarget = -15;
      } else {
          mainDisplay.zoomTarget = oldZoomTarget
          oldZoomTarget = undefined;
      }
  });

  function tick(){
    if (updater.paused){
        setTimeout(tick, 33.5); // 30fps
        return;
    }
    if (updater.world && updater.world.profile.planet){
        setTimeout(function(){showPlanet(updater.world.profile);}, .01);
        return
    }

    if (mainDisplay.zoom < -13 && oldZoomTarget !== undefined){
        map.show();
    } else {
        map.hide();
    }

    if (fastForward[0]){
        updater.tick(0.032, !fastForward[0]); // 30fps game time
        setTimeout(tick, 1);
    } else if (DEBUGMODE){
        var tickTime = updater.tick(0.016, !fastForward[0]); // 60fps game time
        setTimeout(tick, 1); // max fps
    } else {
        //var tickTime = updater.tick(0.032, !fastForward[0]); // 30fps game time
        var tickTime = updater.tick(0.04, !fastForward[0]); // trying faster game speed
        setTimeout(tick, Math.max(5, 33.5-tickTime)); // 30fps
    }
    //    setTimeout(tick, Math.max(5, 1033.5-tickTime)); // 1fps, good for low cpu usage
  }

  tick();
}
