var pilotScriptSource = require("raw!./scripts/pilot.js");
import { Gov } from './interfaces';
import { Mission, Event, MissionStatic } from './mission';
import { putMessage } from './messagelog';
import { Ship, universe } from './universe';

// Plan:
// Profile is a serializable object that only gets saved on landing.
//
// Profile is saved each time the player
//   * lands on a planet
//   * takes off from planet
//   * anything important on a planet happens
//
// Missions, stored on the Profile object, have a chance to process events.


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
        return value.map(function(x: Mission){ return x.save(); })
    }
    return value;
}

function jsonProfileReviver(key: string, value: any){
    if (key === 'missions'){
        return value.map(function(x: any){
            return Mission.fromNameAndData(x[0], x[1])
        });
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
        var data = localStorage.getItem('profile')
        if (data === null){ return Profile.newProfile(); }
        var profile = Profile.fromJson(data);
        if ((<any>window).DEBUGMODE){ (<any>window).profile = profile; }
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
        var data = localStorage.setItem('profile', this.toJson());
        localStorage.setItem('profile', this.toJson());
        return this;
    }
    static clear(){
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
    initiateMission(m: MissionStatic, data: any){
        this.missions.push(new m(data))
        return this;
    }
    initiateMissions(m: [MissionStatic, any][]){
        var self = this;
        m.map(function(x: [MissionStatic, any]){
            self.initiateMission(x[0], x[1]);
        });
        return this;
    }
    missionsSummary(): string{
        var msg = '';
        for (var mission of this.missions){
            msg += mission.instructions();
            msg += "\n";
        }
        if (this.missions.length === 0){
            msg = 'No current missions';
        }
        return msg;
    }
    getMissionShips(): [Ship, any][]{
        return [].concat.apply([],
            this.missions.map(function(mission){
                return mission.getShips();
            })
       );
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
    script: string;
    missions: Mission[];
    day: number;
    //missions: [string, any][];
    reputation: ReputationTable;
    ship: Ship;
}
