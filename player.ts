var pilotScriptSource = require("raw!./scripts/pilot.js");

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
        return new Player(JSON.parse(data));
    }
    toJson(): string{
        return JSON.stringify(this);
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

    static newPlayer(): Player{
        return new Player({
            spaceLocation: [100, 100],
            location: 'Sol',
            name: 'Slippy',
            script: pilotScriptSource,
            missions: [],
            //script: 'while (true){ thrustFor(.1); leftFor(.1); }'
        })
    }
    // schema for objects:
    spaceLocation: [number, number];
    name: string;
    location: string;
    script: string;
    missions: [string, any][]
}
