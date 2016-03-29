import { Planet, universe } from './universe';
import { Profile } from './profile';
import { getLandscapeFilename } from './sprite';
import { outerspace } from './outerspace';
import { Engine } from './engine';

//TODO this is stuff that should probably be build with react
var profile: Profile;
var leaveButton = document.getElementById('leaveButton');
leaveButton.addEventListener('click', leave);

var planetui = document.getElementById('planetui');

export function showPlanet(p: Profile){
    profile = p;
    var planet = universe.planets[profile.planet];
    var landscape = <HTMLImageElement>document.getElementById('landscape');
    landscape.src = getLandscapeFilename(planet.landscape);
    planetui.hidden = false;
    var planetDescription = document.getElementById('planetDescription');
    planetDescription.innerHTML = planet.description;
}

function leave(){
    planetui.hidden = true;
    profile.planet = undefined;
    outerspace(Engine.fromProfile(profile));
}
