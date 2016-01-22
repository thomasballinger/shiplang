function makeFullscreen(){
  var canvas = document.getElementsByTagName("canvas")[0];
  var body = document.getElementsByTagName("body")[0];
  console.log(canvas);
  canvas.addEventListener('click', function(){
    if (body.requestFullscreen) {
      body.requestFullscreen();
    } else if (body.mozRequestFullScreen) {
      body.mozRequestFullScreen();
    } else if (body.webkitRequestFullscreen) {
      body.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
    setTimeout(resizeCanvas, 1000);
  });
}

function randomizeBackground(){
  var canvas = document.getElementById('canvas');
  canvas.style.backgroundImage = "url('/images/" + Math.ceil( Math.random()*8) + ".jpg')";
}

function setBackgroundClassToSimulation(){
  var canvas = document.getElementById('canvas');
  canvas.classList.toggle('space-background');
  canvas.classList.toggle('grid-background');
}

function stealBacktick(){
  var editor = document.getElementById('editor');
  var canvas = document.getElementById('canvas');
  function toggleEditor(){
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

function resizeCanvas(){
  var canvas = document.getElementById('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

exports.resizeCanvas = resizeCanvas;
exports.waitForWindow = waitForWindow;
exports.stealBacktick = stealBacktick;
exports.randomizeBackground = randomizeBackground;
exports.makeFullscreen = makeFullscreen;
exports.setBackgroundClassToSimulation = setBackgroundClassToSimulation;
