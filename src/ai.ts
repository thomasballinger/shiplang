import { SLgetScripts } from './scriptenv';
import { Gov } from './interfaces';

// Don't initialize immediately to delay running evaluationg code
var builtinScripts: any;

var gunnerScript = require("raw!../scripts/gunner.js");
var manualShipScript = require("raw!../scripts/pilot.js");

export function chooseScript(governments: Gov, personality: string[]){
    initializeSL();
    for (var word of personality){
        if (builtinScripts.hasOwnProperty(word)){
            return builtinScripts[word];
        }
    }
    return builtinScripts.foreverVisitPlanetsScript;
}

//TODO differentiate between JS and SL scripts
export function getScriptByName(name: string): any{
    initializeSL();
    if (builtinScripts.hasOwnProperty(name)){
        return builtinScripts[name];
    }
    throw Error("can't find script "+name);
}

export function getJSByName(name: string): any{
    if (name === 'gunner'){ return gunnerScript; }
    if (name === 'manual'){ return manualShipScript; }
    throw Error("can't find script "+name);
}

function initializeSL(){
    if (builtinScripts === undefined){
        builtinScripts = SLgetScripts(require("raw!../scripts/pilot.sl"));
    }
}
