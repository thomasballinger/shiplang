var pilotScriptSource = require("raw!./scripts/pilot.js");
import { Gov } from './interfaces';
import { Event } from './mission';
import { putMessage } from './messagelog';
import { Ship, Mission, Fleet, System, universe } from './universe';
var DEBUGMODE = require('DEBUGMODE');

// Plan:
// Profile is a serializable object that only gets saved on landing.
//
// Profile is saved each time the player
//   * lands on a planet
//   * takes off from planet
//   * anything important on a planet happens
//
// Missions, stored on the Profile object, have a chance to process events.
//

//TODO separate out portions of profile that persist through restarts and
// deaths and those that don't. It's really two objects with two different
// sets of behaviors.
// The only thing right now that does this is scripts


interface ReputationTable {
    [government: number]: number;
    // wish I could write
    // [government: Gov]: number;
}
interface AnnoyedTable {
    [government: number]: boolean;
}

function jsonProfileReplacer(key: string, value: any){
    if (key === 'missions'){
        return value.map(function(x: [Mission, any]){
            return x[0].save(x[1]);
        })
    }
    if (key === 'location'){
        return value.id;
    }
    return value;
}

function jsonProfileReviver(key: string, value: any){
    if (key === 'missions'){
        return value.map(function(x: [string, any]){
            if (universe.missions[x[0]] === undefined){
                throw Error("Can't find serialized mission name: "+x[0])
            }
            return [universe.missions[x[0]], x[1]];
        });
    }
    if (key === 'location'){
        return universe.systems[value];
    }
    return value;
}

export class Profile{
    constructor(data: any){
        for (var prop of Object.keys(data)){
            (<any>this)[prop] = data[prop];
        }
    }
    static fromStorage(): Profile{
        if (typeof window === 'undefined') {
            // shim for node
            data = null;
        } else {
            var data = localStorage.getItem('profile')
        }
        if (data === null){ return Profile.newProfile(); }
        var profile = Profile.fromJson(data);
        if (DEBUGMODE){ (<any>window).profile = profile; }
        return profile;
    }
    static fromJson(data: string): Profile{
        return new Profile(JSON.parse(data, jsonProfileReviver));
    }
    toJson(): string{
        return JSON.stringify(this, jsonProfileReplacer);
    }
    go(){
        this.save();
        (<any>window).location.reload();
    }
    save(): Profile{
        if (typeof window === 'undefined'){ return this; }
        var data = localStorage.setItem('profile', this.toJson());
        localStorage.setItem('profile', this.toJson());
        return this;
    }
    static clear(){
        if (typeof window === 'undefined'){ return this; }
        localStorage.removeItem('profile');
    }
    set(prop: string, value: any): Profile{
        (<any>this)[prop] = value;
        return this
    }
    deepCopyCreate(): Profile{
        return Profile.fromJson(this.toJson());
    };
    deepCopyPopulate = function(copy: Profile, memo:any, innerDeepCopy:any){
        //NOP because simple JSON copy works
    };
    initiateMission(m: Mission){
        this.missions.push(m.begin());
        return this;
    }
    initiateMissions(m: Mission[]){
        var self = this;
        m.map(function(x: Mission){
            self.initiateMission(x);
        });
        return this;
    }
    missionsSummary(): string{
        var msg = '';
        for (var mission of this.missions){
            msg += mission[0].description;
            msg += "\n";
        }
        if (this.missions.length === 0){
            msg = 'No current missions';
        }
        return msg;
    }
    getMissionFleets(): Fleet[]{
        return [].concat.apply([],
            this.missions.map(function(mission){
                return mission[0].getFleets();
            })
       );
    }
    getSystems(): System[]{
        return Object.keys(universe.systems).map(function(x){
            return universe.systems[x];
        });
    }
    static newProfile(): Profile{
        var reputation: ReputationTable = {};
        for (var i=0; i<Gov.LAST; i++){
            reputation[i] = 1;
        }
        var annoyed: AnnoyedTable = {};
        for (var i=0; i<Gov.LAST; i++){
            annoyed[i] = false;
        }
        return new Profile({
            spaceLocation: [100, 100],
            location: 'Sol',
            name: 'Slippy',
            planet: undefined,
            script: pilotScriptSource,
            //script: 'while (true){ thrustFor(.1); leftFor(.1); }'
            missions: [],
            reputation: {},
            day: 0,
            ship: universe.ships['Triangle'],
        })
    }
    // schema for objects:
    spaceLocation: [number, number];
    name: string;
    location: string;
    planet: string;
    script: string;
    day: number;
    missions: [Mission, any][];
    reputation: ReputationTable;
    ship: Ship;
}
