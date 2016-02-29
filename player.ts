var pilotScriptSource = require("raw!./scripts/pilot.js");

// Profile is a serializable object that 
// The record not permanently saved until landing is called "Profile"
// Upon landing the profile is saved.
//
// Both of these should be 

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
        return this.save()
    }

    static newPlayer(): Player{
        return new Player({
            spaceLocation: [100, 100],
            location: 'Sol',
            name: 'Slippy',
            script: pilotScriptSource,
            //script: 'while (true){ thrustFor(.1); leftFor(.1); }'
        })
    }
    // schema for objects:
    spaceLocation: [number, number];
    name: string;
    location: string;
    script: string;
}

