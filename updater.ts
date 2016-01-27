//Orchestrates stuff
import space = require('./space');
import entity = require('./entity');
var manual = require('./manual');
import scriptEnv = require('./scriptenv');
import scenarios = require('./scenarios');
import SLeval = require('./eval');

interface Updateable {
    update(e: entity.Entity, w: space.SpaceWorld): void;
}

export class Updater{
    constructor(public setError: (msg: string)=>void,
                public clearError: ()=>void,
                public queueWarning: (msg: string)=>void,
                public getCode: ()=>string, // gets updated code
                public keyHandlerId: string, // where to set key handlers
                public worldBuilder: scenarios.WorldBuilder,
                public language: string){

        var keyHandlerTarget = document.getElementById(keyHandlerId);
        this.controls = new manual.Controls(keyHandlerTarget);
        scriptEnv.setKeyControls(this.controls);
        this.observers = [];
        this.tickers = [];
        this.lastValid = {};
        this.world = this.worldBuilder(this.lastValid);
        console.log(this.worldBuilder.instructions);
        this.savedWorlds = [];
        this.player = this.world.getPlayer();
        this.codeHasChanged = false;
        this.pleaseRewind = false;
    }
    world: space.SpaceWorld;
    lastValid: any;
    codeHasChanged: boolean;
    controls: any;
    observers: Updateable[];
    tickers: (()=>void)[];
    savedWorlds: space.SpaceWorld[];
    player: entity.Ship;
    pleaseRewind: boolean;

    // objects to call .update() on ever tick
    registerObserver(obj: Updateable){
        this.observers.push(obj);
    }
    // functions to call on ever tick
    registerTicker(obj: ()=>void){
        this.tickers.push(obj);
    }

    // called when the editor has new state (it might not actually
    // be different, Updater will check)
    notifyOfCodeChange(){
        this.codeHasChanged = true;
    }

    // restore an old state
    rewind(){ this.pleaseRewind = true; }

    loadSL(){
        var s = this.getCode();
        var c = SLeval.parseOrShowError(s, this.setError);
        if (c !== undefined){
            this.clearError();
            try {
                var userScripts = scriptEnv.SLgetScripts(s);
            } catch (e) {
                this.setError(e.message);
                var userScripts = undefined;
            }
            if (userScripts){
                this.lastValid = userScripts;
                this.world = this.worldBuilder(this.lastValid);
                this.player = this.world.getPlayer();
            }
        }
    }

    loadJS(){
    }

    // please advance world state one tick and update displays
    tick(dt: number):number{
        var tickStartTime = new Date().getTime();

        if (this.codeHasChanged){
            if (this.language.toLowerCase() === 'shiplang'){
                this.loadSL();
            } else if (this.language.toLowerCase() == 'javascript'){
                this.loadJS();
            } else {
                throw Error("don't know language "+this.language)
            }
            this.codeHasChanged = false;
        } else if (this.pleaseRewind){
            this.world = this.savedWorlds[0];
            this.savedWorlds.length = 0 // this clears the array, who knew
            this.player = this.world.getPlayer();
            this.pleaseRewind = false;
            this.player.dh = 0;
            this.player.thrust = 0;
        }

        var world = this.world;
        var player = this.world.getPlayer();
        world.tick(dt, this.setError);
        this.observers.map(function(obs){
            obs.update(player, world);
        })

        if (this.player.dead){
            this.world = this.worldBuilder(this.lastValid);
            this.player = this.world.getPlayer();
        }
        this.savedWorlds.push(this.world.copy());
        if (this.savedWorlds.length > 100){
            this.savedWorlds.shift();
        }

        var tickTime = new Date().getTime() - tickStartTime;
        return tickTime
    }
}
