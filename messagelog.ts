var messagelog = document.getElementById('messagelog');
var lastMessageTime = 0;

export function putMessage(s: string){
  messagelog.innerHTML = messagelog.innerHTML + '<br/>' + s;
  lastMessageTime = new Date().getTime();
  setTimeout(function(){
      if (new Date().getTime() > lastMessageTime + 1000){
          messagelog.innerHTML = '';
      }
  }, 2000);
}

//TODO save these in player object
