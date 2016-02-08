//Orchestrates stuff
import { SpaceWorld } from './space';
import { Ship, Entity } from './entity';
var manual = require('./manual');
import * as scriptEnv from './scriptenv';
import * as SLeval from './eval';
import { UserFunctionBodies } from './userfunctionbodies';
var jsastdiff = require('./jsastdiff');

import { WorldBuilder } from './interfaces';

interface Updateable {
    update(e: Entity, w: SpaceWorld): void;
}

export class Updater{
    constructor(public setError: (msg: string)=>void,
                public clearError: ()=>void,
                public queueWarning: (msg: string)=>void,
                public getCode: ()=>string, // gets updated code
                public keyHandlerId: string, // where to set key handlers
                public worldBuilder: WorldBuilder,
                public language: string,
                public highlight?: (start: number, finish: number)=>void){

        var keyHandlerTarget = document.getElementById(keyHandlerId);
        this.controls = new manual.Controls(keyHandlerTarget);
        scriptEnv.setKeyControls(this.controls);
        this.observers = [];
        this.tickers = [];
        console.log(this.worldBuilder.instructions);
        this.savedWorlds = [];
        this.codeHasChanged = false;
        this.userFunctionBodies = new UserFunctionBodies();
        this.world = this.worldBuilder(['1', this.userFunctionBodies, highlight]);
        this.player = this.world.getPlayer();
        this.lastValid = '1';
    }
    world: SpaceWorld;
    lastValid: string;
    codeHasChanged: boolean;
    controls: any;
    observers: Updateable[];
    tickers: (()=>void)[];
    savedWorlds: SpaceWorld[];
    player: Ship;
    userFunctionBodies: UserFunctionBodies;

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
                this.lastValid = s;
                this.world = this.worldBuilder(this.lastValid);
                this.player = this.world.getPlayer();
            }
        }
    }

    loadJS(){
        var s = this.getCode();
        try {
            var newAST = (<any>window).acorn.parse(s);
            this.clearError();
        } catch (e) {
            this.setError(e);
            s = undefined;
        };
        if (s){
            var changed = jsastdiff.changedNamedFunctions(
                (<any>window).acorn.parse(this.lastValid), newAST);
            if (changed.hasOwnProperty('*main*')){
                console.log('resetting everything')
                // start over totally, top level change
                this.userFunctionBodies.reset();
                this.world = this.worldBuilder([s, this.userFunctionBodies, this.highlight]);
                this.player = this.world.getPlayer();
            } else {
                for (var name of Object.keys(changed)){
                    this.userFunctionBodies.saveBody(name, changed[name]);
                }
                var save = this.userFunctionBodies.getEarliestSave(Object.keys(changed));
                if (save === undefined){
                    // NOP because the modified functions have never been called
                } else if (save === null) {
                    // Start over because modified functions have never been *defined*
                    this.userFunctionBodies.reset();
                    this.world = this.worldBuilder([s, this.userFunctionBodies, this.highlight]);
                    this.player = this.world.getPlayer();
                } else {
                    console.log('doing a restore');
                    this.world = save;
                    this.player = this.world.getPlayer();
                }
            }
            this.lastValid = s;
        }
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
        }
        var world = this.world;
        var player = this.world.getPlayer();
        //world.tick(dt, this.setError);
        world.tick(dt, function(e){ throw e; });
        this.observers.map(function(obs){
            obs.update(player, world);
        })

        if (this.player.dead){
            this.world = this.worldBuilder([this.lastValid, this.userFunctionBodies]);
            this.player = this.world.getPlayer();
        }
        /*
        this.savedWorlds.push(this.world.copy());
        if (this.savedWorlds.length > 100){
            this.savedWorlds.shift();
        }
        */
        this.userFunctionBodies.save(this.world.copy());

        var tickTime = new Date().getTime() - tickStartTime;
        return tickTime
    }
}
