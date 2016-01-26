//Orchestrates stuff
import space = require('./space');
import entity = require('./entity');
var manual = require('./manual');
import scriptEnv = require('./scriptenv');
import scenarios = require('./scenarios');
import evaluation = require('./eval');

interface Updateable {
    update(e: entity.Entity, w: space.SpaceWorld): void;
}

export class Updater{
    constructor(public setError: (msg: string)=>void,
                public clearError: ()=>void,
                public queueWarning: (msg: string)=>void,
                public getCode: ()=>string, // gets updated code
                public keyHandlerId: string, // where to set key handlers
                public worldBuilder: scenarios.WorldBuilder){

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

    // please advance world state one tick and update displays
    tick(dt: number):number{
        var tickStartTime = new Date().getTime();

        if (this.codeHasChanged){
            var s = this.getCode();
            console.log('got code from editor:', s);
            var c = evaluation.parseOrShowError(s, this.setError);
            if (c !== undefined){
                this.clearError();
                try {
                    var userScripts = scriptEnv.getScripts(s);
                } catch (e) {
                    this.setError(e.message);
                    var userScripts = undefined;
                }
                if (userScripts){
                    this.lastValid = userScripts;
                    console.log('resetting world with:', this.worldBuilder);
                    this.world = this.worldBuilder(this.lastValid);
                    this.player = this.world.getPlayer();
                }
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

        this.world.tick(dt);
        var world = this.world;
        this.observers.map(function(obs){
            obs.update(world.getPlayer(), world);
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
