function makeFullscreen(element){
  if (element.requestFullscreen) {
   element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  }
}

function stealSimulatorKeys(updater){
  var canvas = document.getElementById('canvas');
  function toggleEditor(){
      var editor = document.getElementById('editor');
      if(editor.hidden){
          editor.hidden = false;
          editor.focus();
      } else {
          editor.hidden = true;
          canvas.focus();
      }
  }
  window.addEventListener('keydown', function(e){
    if (e.keyCode === 192){  // back tick
      toggleEditor();
      e.stopPropagation();
      e.preventDefault();
    }
    if (e.keyCode === 220){
      updater.toggleView();
      e.stopPropagation();
      e.preventDefault();
    }
  });
}

function stealDebugKeys(display, fastForward){
  if (window.DEBUGMODE){
    window.addEventListener('keydown', function(e){
      // can't use q in debug mode to write scripts :)
      if (e.keyCode === 81) {
        updater.reset();
        e.stopPropagation();
        e.preventDefault();
      }
      // or z
      if (e.keyCode === 90) {
        fastForward[0] = !fastForward[0];
        e.stopPropagation();
        e.preventDefault();
      }
    });
  }
}

function stealZoomKeys(display){
  window.addEventListener('keydown', function(e){
    // stealing right command
    if (e.keyCode === 93) {
      display.zoomIn();
      e.stopPropagation();
      e.preventDefault();
    }
    // and alt
    if (e.keyCode === 18) {
      display.zoomOut();
      e.stopPropagation();
      e.preventDefault();
    }
  });
}

function stealPauseAndMapKeys(pause, map){
  window.addEventListener('keydown', function(e){
    // stealing right command
    if (e.keyCode === 80){ //p
      pause();
      e.stopPropagation();
      e.preventDefault();
    }
    if (e.keyCode === 77){ //m
      map();
      e.stopPropagation();
      e.preventDefault();
    }
  });
}

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

function resizeCanvas(id){
  var canvas = document.getElementById(id);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

exports.resizeCanvas = resizeCanvas;
exports.waitForWindow = waitForWindow;
exports.stealSimulatorKeys = stealSimulatorKeys;
exports.stealDebugKeys = stealDebugKeys;
exports.stealZoomKeys = stealZoomKeys;
exports.stealPauseAndMapKeys = stealPauseAndMapKeys;
exports.makeFullscreen = makeFullscreen;
