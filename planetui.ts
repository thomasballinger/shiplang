import { Planet, universe } from './universe';
import { Profile } from './profile';
import { getLandscapeFilename } from './sprite';

//TODO this is stuff that should probably be build with react

export function showPlanet(profile: Profile){
    var planet = universe.planets[profile.planet];
    console.log('you are on the planet', planet);
    var planetui = document.getElementById('planetui');
    var landscape = <HTMLImageElement>document.getElementById('landscape');
    landscape.src = getLandscapeFilename(planet.landscape);
    planetui.hidden = false;
    var planetstuff = document.getElementById('planetstuff');
    planetstuff.innerHTML = planet.description;

}
