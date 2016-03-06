var pilotScriptSource = require("raw!./scripts/pilot.js");
import { Gov } from './interfaces';
import { Mission, Event } from './mission';

// Plan:
// Get rid of Player, replace with Profile
// Profile is a serializable object that only gets saved on landing.
// The temporary part is called log?
//
// Log saved to profile each time
//   * landed on a planet
//   * take off from planet
//   * anything on a planet happens
//
// Example Log:
// Hit a government shuttlecraft with a laser
// Hit a government shuttlecraft with a missile
// Killed a government shuttlecraft
// *Landed on Earth*
// *Took off from Earth into Sol system*
// Jumped to robo system
// Laser at alien digeridoo
// Laser at alien digeridoo
// Killed alien digeridoo
// Landed on tolok
//
// Actions: 
// need current missions
//
// For debugging there should be a way to view this log
//
// When loading player, location accessors can be accessors
// on log data:
// * location (system or planet)
// * space location (coordinates in space)
//
// Some data will actually be stored:
// script string;
// savedScripts string[];
//
//
// what about missions like "defend shuttles in system"
// escort these specific three
//
// how to deal with living systems where people jump in and out?
// how to create conditions like "if this mission, spawn these ships"
// on-ship-death triggers, or 
//
//
// Player should be deepcopied so it can be restored on reset.
// Therefore it should be stored on the system somewhere.


interface ReputationTable {
    [government: number]: number;
    // wish I could write
    // [government: Gov]: number;
}
interface AnnoyedTable {
    [government: number]: boolean;
}

function jsonPlayerReplacer(key: string, value: any){
    if (key === 'missions'){
        return value.map(function(x: Mission){ return x.save(); })
    }
    return value;
}

function jsonPlayerReviver(key: string, value: any){
    if (key === 'missions'){
        return value.map(function(x: any){
            return Mission.fromNameAndData(x[0], x[1])
        });
    }
    return value;
}

export class Player{
    constructor(data: any){
        for (var prop of Object.keys(data)){
            (<any>this)[prop] = data[prop];
        }
    }
    static fromStorage(): Player{
        var data = localStorage.getItem('player')
        if (data === null){ return Player.newPlayer(); }
        var player = Player.fromJson(data);
        (<any>window).player = player;
        return player;
    }
    static fromJson(data: string): Player{
        return new Player(JSON.parse(data, jsonPlayerReviver));
    }
    toJson(): string{
        return JSON.stringify(this, jsonPlayerReplacer);
    }
    go(){
        this.save();
        (<any>window).location.reload();
    }
    save(): Player{
        var data = localStorage.setItem('player', this.toJson());
        localStorage.setItem('player', this.toJson());
        return this;
    }
    static clear(){
        localStorage.removeItem('player');
    }
    set(prop: string, value: any): Player{
        (<any>this)[prop] = value;
        return this
    }
    deepCopyCreate(): Player{
        return Player.fromJson(this.toJson());
    };
    deepCopyPopulate = function(copy: Player, memo:any, innerDeepCopy:any){
        //NOP because simple JSON copy works
    };
    addMission(m: Mission){
        this.missions.push(m);
    }

    static newPlayer(): Player{
        var reputation: ReputationTable = {};
        for (var i=0; i<Gov.LAST; i++){
            reputation[i] = 1;
        }
        var annoyed: AnnoyedTable = {};
        for (var i=0; i<Gov.LAST; i++){
            annoyed[i] = false;
        }
        return new Player({
            spaceLocation: [100, 100],
            location: 'Sol',
            name: 'Slippy',
            script: pilotScriptSource,
            //script: 'while (true){ thrustFor(.1); leftFor(.1); }'
            missions: [],
            reputation: {},
        })
    }
    // schema for objects:
    spaceLocation: [number, number];
    name: string;
    location: string;
    script: string;
    missions: Mission[];
    //missions: [string, any][];
    reputation: ReputationTable;
}
