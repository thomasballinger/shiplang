import { Profile } from './profile';

var lastMessageTime = 0;

export function putMessage(s: string, e?: any){
    var messagelog = document.getElementById('messagelog');
    if (e !== undefined){
        s = e.type + ' says: '+s;
    }
    s = template(s);
    messagelog.innerHTML = messagelog.innerHTML + '<br/>' + s;
    lastMessageTime = new Date().getTime();
    setTimeout(function(){
        if (new Date().getTime() > lastMessageTime + 3000){
            messagelog.innerHTML = '';
        }
    }, 5000);
}

function template(msg: string){
    return msg.replace('NAME', Profile.fromStorage().name);
}

//TODO save these in player object
