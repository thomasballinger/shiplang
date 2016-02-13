import { Player } from './player';

var earthtexts = require("raw!./text/earth.txt").split(/\n---\n?/g);


function style(text: string): string{
    return text.replace(/\n/g, '<br/>');
}

export function earth(){
    var bar = document.getElementById('modalbar');
    var index = 0;
    bar.innerHTML = style(earthtexts[index]);
    bar.hidden = false;
    bar.addEventListener('click', function(){
        index += 1;
        if (index > earthtexts.length-1){
            Player.fromStorage().set('location', 'Sol').go();
        } else {
            bar.innerHTML = style(earthtexts[index]);
        }
    });
}
