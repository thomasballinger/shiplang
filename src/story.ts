import { Profile } from './profile';

var earthtexts = require("raw!../text/earth.txt").split(/\n---\n?/g);
var toloktexts = require("raw!../text/tolok.txt").split(/\n---\n?/g);


function style(text: string): string{
    return text.replace(/\n/g, '<br/>');
}

function storyClicker(texts: string[], atEnd: ()=>void){
    var bar = document.getElementById('modalbar');
    var index = 0;
    bar.innerHTML = style(texts[index]);
    bar.hidden = false;
    bar.addEventListener('click', function(){
        index += 1;
        if (index > texts.length-1){
            atEnd();
        } else {
            bar.innerHTML = style(texts[index]);
        }
    });
}

export function earth(){
    storyClicker(earthtexts, function(){
        Profile.fromStorage().set('location', 'Sol').go();
    })
}

export function tolok(){
    storyClicker(toloktexts, function(){
        Profile.fromStorage().set('location', 'robo').go();
    });
}
