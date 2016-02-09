function makeFullscreen(element){
  if (element.requestFullscreen) {
   element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  }
}

function stealBacktick(onQ){
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
    if ([192  // back tick
        ].indexOf(e.keyCode) !== -1){
      toggleEditor();
      e.stopPropagation();
      e.preventDefault();
    }
    if (onQ && e.keyCode === 81){
      onQ();
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
exports.stealBacktick = stealBacktick;
exports.makeFullscreen = makeFullscreen;
