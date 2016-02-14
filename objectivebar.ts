var objectivebar = document.getElementById('objectivebar');

export function set(s: string){
  objectivebar.innerHTML = s;
  objectivebar.hidden = false;
}
export function clear(){ objectivebar.hidden = true; }
