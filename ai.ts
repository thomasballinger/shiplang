import { SLgetScripts } from './scriptenv';
import { Gov } from './interfaces';

// Don't initialize immediately to delay running evaluationg code
var builtinScripts: any;

var gunnerScript = require("raw!./scripts/gunner.js");
var manualShipScript = require("raw!./scripts/pilot.js");

export function chooseScript(governments: Gov, personality: string[]){
    initialize();
    for (var word of personality){
        if (builtinScripts.hasOwnProperty(word)){
            return builtinScripts[word];
        }
    }
    return builtinScripts.foreverVisitPlanetsScript;
}

//TODO differentiate between JS and SL scripts
export function getScriptByName(name: string): any{
    initialize();
    if (name === 'gunner'){ return gunnerScript; }
    if (name === 'manual'){ return manualShipScript; }
    if (builtinScripts.hasOwnProperty(name)){
        return builtinScripts[name];
    }
    return 'log("could not find script")';

}

function initialize(){
    if (builtinScripts === undefined){
        builtinScripts = SLgetScripts(require("raw!./scripts/pilot.sl"));
    }
}
