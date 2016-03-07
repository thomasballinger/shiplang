import { SLgetScripts } from './scriptenv';
import { Gov } from './interfaces';

export var builtinScripts = SLgetScripts(require("raw!./scripts/pilot.sl"));
export var gunnerScript = require("raw!./scripts/gunner.js");
export var manualShipScript = require("raw!./scripts/pilot.js");

export function chooseScript(governments: Gov, personality: string[]){
    for (var word in personality){
        if (builtinScripts.hasOwnProperty(word)){
            return builtinScripts[word];
        }
    }
    return builtinScripts.foreverVisitPlanetsScript;
}

//TODO differentiate between JS and SL scripts
export function getScriptByName(name: string): any{
    console.log('asked for:', name);
    if (name === 'gunner'){ return gunnerScript; }
    if (name === 'manual'){ return manualShipScript; }
    if (builtinScripts.hasOwnProperty(name)){
        return builtinScripts[name];
    }
    return 'log("could not find script")';

}
