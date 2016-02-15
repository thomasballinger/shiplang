//Orchestrates stuff
import { SpaceWorld } from './space';
import { Ship, Entity } from './entity';
var manual = require('./manual');
import * as scriptEnv from './scriptenv';
import * as SLeval from './eval';
import { UserFunctionBodies } from './userfunctionbodies';
import { Player } from './player';
var jsastdiff = require('./jsastdiff');

import { WorldBuilder, Updateable, Selection } from './interfaces';

export class Updater{
    constructor(public setError: (msg: string)=>void,
                public clearError: ()=>void,
                public queueWarning: (msg: string)=>void,
                public getCode: ()=>string, // gets updated code
                public keyHandlerId: string, // where to set key handlers
                public worldBuilder: WorldBuilder,
                public language: string,
                public onReset?: ()=>void,
                public highlight?: (id: string, selections: Selection[])=>void,
                public doSnapshots?: boolean,
                public onChangeViewedEntity?: (e: Ship)=>void){

        var keyHandlerTarget = document.getElementById(keyHandlerId);
        this.controls = new manual.Controls(keyHandlerTarget);
        scriptEnv.setKeyControls(this.controls);
        this.observers = [];
        this.tickers = [];
        //console.log(this.worldBuilder.instructions);
        this.savedWorlds = [];
        this.codeHasChanged = false;
        this.userFunctionBodies = new UserFunctionBodies();
        this.world = this.worldBuilder(['1', this.userFunctionBodies, highlight]);
        this.player = this.world.getPlayer();
        this.viewedEntity = this.player;
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
    _viewedEntity: Ship;
    userFunctionBodies: UserFunctionBodies;

    get viewedEntity(): Ship{
        return this._viewedEntity;
    }
    set viewedEntity(value: Ship){
        if (this.onChangeViewedEntity) {
            this.onChangeViewedEntity(value);
        }
        this._viewedEntity = value;
    }

    toggleView(){
        var viewable = this.world.entities.filter(function(x){ return x.viewable })
        var currentIndex = viewable.indexOf(this.viewedEntity);
        if (currentIndex === -1){
            this.ensureView()
        }
        this.viewedEntity = <Ship>(viewable[(currentIndex + 1) % viewable.length]);
    }
    // if currently viewed entity doesn't exist, use the player instead;
    ensureView(){
        var viewable = this.world.entities.filter(function(x){ return x.viewable })
        if (viewable.indexOf(this.viewedEntity) === -1){
            this.viewedEntity = this.player;
        }
    }

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
                this.viewedEntity = this.player;
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
            Player.fromStorage().set('script', s);
            var changed = jsastdiff.changedNamedFunctions(
                (<any>window).acorn.parse(this.lastValid), newAST);
            if (changed.hasOwnProperty('*main*')){
                // start over totally, top level change
                this.userFunctionBodies.reset();
                this.world = this.worldBuilder([s, this.userFunctionBodies, this.highlight]);
                this.player = this.world.getPlayer();
                this.viewedEntity = this.player;
                this.onReset();
            } else if (Object.keys(changed).length === 0) {
                //console.log('no function asts changed');
            } else {
                for (var name of Object.keys(changed)){
                    //console.log('saving body for', name, changed[name])
                    this.userFunctionBodies.saveBody(name, changed[name]);
                }
                var save = this.userFunctionBodies.getEarliestSave(Object.keys(changed));
                if (save === undefined){
                    // NOP because the modified functions have never been called
                    //console.log('not restoring because modified function never called');
                } else if (save === null) {
                    // Start over because modified functions have never been *defined*
                    //console.log('starting over, function not yet defined');
                    this.userFunctionBodies.reset();
                    this.world = this.worldBuilder([s, this.userFunctionBodies, this.highlight]);
                    this.player = this.world.getPlayer();
                    this.viewedEntity = this.player;
                    this.onReset();
                } else {
                    //console.log('restoring from game time', save.gameTime)
                    this.world = save;
                    this.player = this.world.getPlayer();
                    this.viewedEntity = this.player;
                    this.onReset();
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
        if (this.doSnapshots){
            var preTickSnapshot = this.world.copy();
        }
        var world = this.world;
        var viewedEntity = this.viewedEntity;
        world.tick(dt, this.setError);
        //world.tick(dt, function(e){ throw e; });
        this.ensureView()
        this.observers.map(function(obs){
            obs.update(viewedEntity, world);
        })

        //TODO factor out reset behavior
        if (this.player.dead){
            this.world = this.worldBuilder([this.lastValid, this.userFunctionBodies, this.highlight]);
            this.player = this.world.getPlayer();
            this.viewedEntity = this.player;
            this.onReset()
        }
        /*
        this.savedWorlds.push(this.world.copy());
        if (this.savedWorlds.length > 100){
            this.savedWorlds.shift();
        }
        */
       if (this.doSnapshots){
            this.userFunctionBodies.save(preTickSnapshot);
       }

        var tickTime = new Date().getTime() - tickStartTime;
        return tickTime
    }
}
