import { Profile } from './profile';

var pauseMenu = document.getElementById('pausemenu');

export function showMenu(profile: Profile){
    pauseMenu.hidden = false
}
export function hideMenu(){
    pauseMenu.hidden = true
}
